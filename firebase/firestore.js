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

export const addCreditsToUser = async (userId, creditsToAdd, transactionDetails = null) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document does not exist');
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.creditBalance || 0;
    const newCreditBalance = currentCredits + creditsToAdd;
    
    // Update user's credit balance
    await updateDoc(userRef, {
      creditBalance: newCreditBalance,
      lastUpdated: new Date()
    });
    
    // If transaction details are provided, store the transaction in history
    if (transactionDetails) {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionsRef, {
        ...transactionDetails,
        previousBalance: currentCredits,
        newBalance: newCreditBalance
      });
    }
    
    console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCreditBalance}`);
    return newCreditBalance;
  } catch (error) {
    console.error('Error adding credits to user:', error);
    throw error;
  }
};