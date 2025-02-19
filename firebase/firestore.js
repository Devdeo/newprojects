
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

export const createUserSubscription = async (userId, plan, expiryDate) => {
  try {
    const userRef = collection(db, 'subscriptions');
    await addDoc(userRef, {
      userId,
      plan,
      purchaseDate: new Date(),
      expiryDate,
      status: 'active'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const checkSubscription = async (userId) => {
  try {
    const userRef = doc(db, 'subscriptions', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const now = new Date();
      const expiry = data.expiryDate.toDate();
      return {
        isActive: now < expiry,
        plan: data.plan,
        expiryDate: expiry
      };
    }
    return { isActive: false };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false };
  }
};
