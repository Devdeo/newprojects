
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { addCreditsToUser } from '../../firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, paymentId, signature, userId, quantity } = req.body;

    if (!orderId || !paymentId || !signature || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify signature
    const text = orderId + '|' + paymentId;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Payment is valid, add credits to user with transaction details
    const walletUpdateTime = new Date();
    const transactionDetails = {
      transactionId: paymentId,
      amount: parseInt(quantity),
      timestamp: walletUpdateTime,
      walletUpdateTime: walletUpdateTime,
      type: 'credit',
      description: `Purchased ${quantity} credits`,
      paymentMethod: 'razorpay',
      balance: null, // Will be calculated in addCreditsToUser
      orderId: orderId
    };
    
    const newBalance = await addCreditsToUser(userId, parseInt(quantity), transactionDetails);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Payment verified and credits added successfully',
      newBalance: newBalance,
      redirect: '/dashboard?payment_success=true'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
