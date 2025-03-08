
import { auth, db } from "../../../../firebase/config";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const { credits, amount, paymentId, orderId } = req.body;

    if (!userId || !credits || !amount || !paymentId || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentBalance = userData.creditBalance || 0;
    const newBalance = currentBalance + parseInt(credits);

    // Update user's credit balance
    await updateDoc(userRef, {
      creditBalance: newBalance,
      lastWalletUpdate: serverTimestamp()
    });

    // Add transaction record
    const transactionRef = collection(db, 'users', userId, 'transactions');
    await addDoc(transactionRef, {
      type: 'credit',
      amount: amount,
      credits: parseInt(credits),
      paymentId: paymentId,
      orderId: orderId,
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ 
      success: true,
      message: 'Credits added successfully',
      newBalance
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    return res.status(500).json({ 
      error: 'Failed to update user credits', 
      message: error.message 
    });
  }
}
