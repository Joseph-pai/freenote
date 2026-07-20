'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToFriends, subscribeToFriendRequests } from '../../lib/firebase/friends';

export function FriendProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const unsubFriends = subscribeToFriends(user.uid);
    const unsubRequests = subscribeToFriendRequests(user.uid);
    
    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user]);

  return <>{children}</>;
}
