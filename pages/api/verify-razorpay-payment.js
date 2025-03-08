
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
      console.log('Signature verification failed');
      return res.status(400).json({ error: 'Payment verification failed' });
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
    const newBalance = currentBalance + parseInt(quantity);

    // Update user's credit balance
    await updateDoc(userRef, {
      creditBalance: newBalance,
      lastWalletUpdate: serverTimestamp()
    });

    // Add transaction record
    const transactionRef = collection(db, 'users', userId, 'transactions');
    await addDoc(transactionRef, {
      type: 'credit',
      amount: parseInt(amount) / 100, // Convert paise to INR
      credits: parseInt(quantity),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      timestamp: serverTimestamp()
    });

    return res.status(200).json({ 
      success: true,
      message: 'Payment verified and credits added successfully',
      newBalance
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Payment verification failed', 
      message: error.message 
    });
  }
}
