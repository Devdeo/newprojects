
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount, quantity } = req.body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Get the user document from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentBalance = userData.creditBalance || 0;
    const newBalance = currentBalance + parseInt(quantity);

    // Update user's credit balance
    await updateDoc(userRef, {
      creditBalance: newBalance,
      lastWalletUpdate: serverTimestamp()
    });

    // Add transaction record
    const transactionRef = collection(db, 'users', userId, 'transactions');
    await addDoc(transactionRef, {
      amount: parseInt(quantity),
      type: 'credit',
      description: `Added ${quantity} credits via Razorpay`,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      timestamp: serverTimestamp(),
      balance: newBalance
    });

    console.log(`Updated user ${userId} balance from ${currentBalance} to ${newBalance}`);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message
    });
  }
}
