import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, limit, arrayUnion, arrayRemove, writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { InviteCode, FriendRequest, AppUser } from '../../types';
import { useFriendStore } from '../../stores/friendStore';
import { deleteConversation } from './messages';

// Generate an 8-character invite code valid for 48 hours
export const generateInviteCode = async (userId: string): Promise<InviteCode> => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const now = Date.now();
  const expiresAt = now + 48 * 60 * 60 * 1000;
  
  const inviteData: Omit<InviteCode, 'id'> = {
    code, creatorId: userId, expiresAt, usedBy: null, createdAt: now,
  };
  
  const ref = await addDoc(collection(db, 'inviteCodes'), inviteData);
  return { id: ref.id, ...inviteData };
};

// Use invite code to send a friend request
export const useInviteCode = async (code: string, currentUserId: string, currentUserNickname: string, currentUserAvatar: string | null) => {
  const q = query(collection(db, 'inviteCodes'), where('code', '==', code.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  
  if (snap.empty) throw new Error('邀請碼無效');
  
  const inviteDoc = snap.docs[0];
  const invite = { id: inviteDoc.id, ...inviteDoc.data() } as InviteCode;
  
  if (invite.usedBy) throw new Error('此邀請碼已被使用');
  if (invite.expiresAt < Date.now()) throw new Error('邀請碼已過期');
  if (invite.creatorId === currentUserId) throw new Error('不能使用自己的邀請碼');
  
  // Check if they are already friends
  const myUserDoc = await getDoc(doc(db, 'users', currentUserId));
  if (myUserDoc.exists()) {
    const me = myUserDoc.data() as AppUser;
    if (me.friends?.includes(invite.creatorId)) {
      throw new Error('你們已經是好友了');
    }
  }

  // Add each other to friends array
  await updateDoc(doc(db, 'users', invite.creatorId), {
    friends: arrayUnion(currentUserId)
  });
  await updateDoc(doc(db, 'users', currentUserId), {
    friends: arrayUnion(invite.creatorId)
  });
  
  // Mark code as used
  await updateDoc(doc(db, 'inviteCodes', invite.id), { usedBy: currentUserId });
};

// Accept a friend request (Client side logic since no cloud functions)
export const acceptFriendRequest = async (request: FriendRequest) => {
  await updateDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' });
  
  // Add each other to friends array
  await updateDoc(doc(db, 'users', request.toUserId), {
    friends: arrayUnion(request.fromUserId)
  });
  await updateDoc(doc(db, 'users', request.fromUserId), {
    friends: arrayUnion(request.toUserId)
  });
};

export const rejectFriendRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
};

export const removeFriend = async (myUserId: string, friendId: string) => {
  // Remove from each other's friends list
  await updateDoc(doc(db, 'users', myUserId), {
    friends: arrayRemove(friendId)
  });
  await updateDoc(doc(db, 'users', friendId), {
    friends: arrayRemove(myUserId)
  });

  // Find and delete shared conversation
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', myUserId)
    );
    const snap = await getDocs(q);
    const conv = snap.docs.find(d => d.data().participants.includes(friendId));
    if (conv) {
      await deleteConversation(conv.id);
    }
  } catch (e) {
    console.warn('Could not delete conversation:', e);
  }
};

export const updateFriendNickname = async (myUserId: string, friendId: string, customNickname: string) => {
  const userRef = doc(db, 'users', myUserId);
  if (customNickname.trim() === '') {
    // If empty, remove the custom nickname field for this friend by using deleteField()? 
    // Or just set to empty string and handle it in UI.
    // Let's set it to empty string so it's simple without importing deleteField.
    await updateDoc(userRef, {
      [`friendNicknames.${friendId}`]: ''
    });
  } else {
    await updateDoc(userRef, {
      [`friendNicknames.${friendId}`]: customNickname.trim()
    });
  }
};

// Subscriptions
export const subscribeToFriendRequests = (userId: string) => {
  const { setFriendRequests } = useFriendStore.getState();
  
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    requests.sort((a, b) => b.createdAt - a.createdAt);
    setFriendRequests(requests);
  });
};

// We need a helper to fetch full profiles for the `friends` ID array.
// Because firestore doesn't do "where id in array" automatically in a snapshot perfectly if the array changes,
// we listen to our own user document, then fetch the profiles.
export const subscribeToFriends = (userId: string) => {
  const { setFriends, setLoading } = useFriendStore.getState();
  setLoading(true);
  
  return onSnapshot(doc(db, 'users', userId), async (snapshot) => {
    if (!snapshot.exists()) return;
    const me = snapshot.data() as AppUser;
    const friendIds = me.friends || [];
    
    if (friendIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }
    
    // Fetch profiles (limited to 30 per 'in' query in Firestore, we'll batch them if needed, but for simplicity here we just use 'in' up to 10)
    try {
      // Chunking for safety if > 10
      const chunks = [];
      for (let i = 0; i < friendIds.length; i += 10) chunks.push(friendIds.slice(i, i + 10));
      
      let profiles: AppUser[] = [];
      for (const chunk of chunks) {
        const q = query(collection(db, 'users'), where('uid', 'in', chunk));
        const res = await getDocs(q);
        profiles = [...profiles, ...res.docs.map(d => d.data() as AppUser)];
      }
      setFriends(profiles);
    } catch (e) {
      console.error("Error fetching friend profiles:", e);
    } finally {
      setLoading(false);
    }
  });
};
