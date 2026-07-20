import { create } from 'zustand';
import { FriendRequest, AppUser } from '../types';

interface FriendState {
  friends: AppUser[];
  friendRequests: FriendRequest[];
  loading: boolean;
  setFriends: (friends: AppUser[]) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  friendRequests: [],
  loading: false,
  setFriends: (friends) => set({ friends }),
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  setLoading: (loading) => set({ loading }),
}));
