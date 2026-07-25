import { collection, doc, addDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import { WebRTCSignal } from '../../types';

export const sendSignal = async (signalData: Omit<WebRTCSignal, 'id' | 'createdAt'>) => {
  const data = {
    ...signalData,
    createdAt: Date.now()
  };
  await addDoc(collection(db, 'signals'), data);
};

export const subscribeToSignals = (userId: string, onSignal: (signal: WebRTCSignal) => void) => {
  const q = query(
    collection(db, 'signals'),
    where('targetId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const signal = { id: change.doc.id, ...change.doc.data() } as WebRTCSignal;
        // Call the callback
        onSignal(signal);
        // Delete the signal immediately after reading to keep it ephemeral
        deleteDoc(change.doc.ref).catch(console.error);
      }
    });
  });
};
