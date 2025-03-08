
import { db } from "./config";
import { doc, updateDoc, getDoc, collection, addDoc } from "firebase/firestore";

export const addCreditsToUser = async (
  userId,
  creditsToAdd,
  transactionDetails = null,
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }

    const userData = userDoc.data();
    const currentCredits = userData.creditBalance || 0;
    const newCreditBalance = currentCredits + creditsToAdd;
    const updateTime = new Date();

    // Update user's credit balance
    await updateDoc(userRef, {
      creditBalance: newCreditBalance,
      lastUpdated: updateTime,
      lastWalletUpdate: updateTime,
    });

    // If transaction details are provided, store the transaction in history
    if (transactionDetails) {
      const transactionsRef = collection(db, "users", userId, "transactions");
      await addDoc(transactionsRef, {
        ...transactionDetails,
        previousBalance: currentCredits,
        newBalance: newCreditBalance,
        walletTimestamp: updateTime,
      });
    }

    console.log(
      `Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCreditBalance}`,
    );
    return newCreditBalance;
  } catch (error) {
    console.error("Error adding credits to user:", error);
    throw error;
  }
};
