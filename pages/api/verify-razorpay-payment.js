import crypto from 'crypto';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, amount, quantity } = req.body;

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.log('Signature verification failed');
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Get the user document from Firestore and update
    try {
      // Update user document with new credit balance
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        creditBalance: increment(quantity),
        lastWalletUpdate: serverTimestamp()
      });

      // Add transaction record - ensuring we add it to the proper collection path
      // This follows the security rule: match /users/{uid}/transactions/{transaction}
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionsRef, {
        type: 'credit_purchase',
        amount: amount,
        quantity: quantity,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        timestamp: serverTimestamp()
      });

      return res.status(200).json({ 
        success: true,
        message: 'Payment verified and credits added successfully' 
      });
    } catch (error) {
      console.error('Firebase update error:', error);
      // Check for permission-denied errors that might be related to security rules
      const errorMessage = error.code === 'permission-denied' 
        ? 'Permission denied: Please check security rules' 
        : error.message;
      
      return res.status(500).json({ 
        error: 'Database update failed', 
        message: errorMessage
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message
    });
  }
}