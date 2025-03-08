
import { addCreditsToUser } from "../../firebase/firestore";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, paymentId, signature, userId, quantity } = req.body;

    if (!orderId || !paymentId || !signature || !userId || !quantity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment verification failed. Invalid signature.' 
      });
    }

    // Add credits to user's account
    const creditsToAdd = parseInt(quantity);
    const newBalance = await addCreditsToUser(userId, creditsToAdd, {
      type: 'credit',
      amount: creditsToAdd,
      description: `Purchased ${creditsToAdd} credits`,
      paymentId: paymentId,
      orderId: orderId,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and credits added successfully',
      newBalance,
      redirect: "/dashboard?payment_success=true"
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to verify payment'
    });
  }
}
