
import crypto from 'crypto';
import { doc, collection, addDoc, serverTimestamp, getDocs, updateDoc, increment, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, quantity } = req.body;

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

    // If userId and quantity are provided, update the user's credit balance in Firebase
    if (userId && quantity) {
      try {
        // Query the user document by UID
        const q = query(collection(db, "users"), where("uid", "==", userId));
        const userDocs = await getDocs(q);
        
        if (userDocs.docs.length === 1) {
          // Update the main user document
          const userRef = doc(db, "users", userDocs.docs[0].id);
          await updateDoc(userRef, {
            creditBalance: increment(parseInt(quantity))
          });
          
          // Add transaction record to subcollection
          const transactionsRef = collection(userRef, 'transactions');
          await addDoc(transactionsRef, {
            type: 'credit_purchase',
            amount: parseInt(quantity) * 10, // Assuming PRICE_PER_CREDIT = 10
            quantity: parseInt(quantity),
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            timestamp: serverTimestamp()
          });
        }
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        return res.status(500).json({ 
          error: 'Database update failed',
          message: dbError.message
        });
      }
    }

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message
    });
  }
}
