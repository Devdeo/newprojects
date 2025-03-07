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

export const addCreditsToUser = async (userId, creditsToAdd) => {
  try {
    //Implementation to add credits to the user would go here.  This is a placeholder.
    console.log(`Attempting to add ${creditsToAdd} credits to user ${userId}`);
    //Example:  Update a user document in Firestore.  Replace with your actual implementation.
    const userRef = doc(db, 'users', userId); // Assumes you have a 'users' collection
    await updateDoc(userRef, {
      credits:  (await getDoc(userRef)).data().credits + creditsToAdd
    });
  } catch (error) {
    console.error('Error adding credits to user:', error);
    throw error;
  }
};