
import crypto from "crypto";
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, paymentId, signature, userId, quantity } = req.body;

    if (!orderId || !paymentId || !signature || !userId || !quantity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

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

    // Fetch payment details from Razorpay for additional verification
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.order_id !== orderId) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed. Order ID mismatch.'
      });
    }

    // In a production app, here you would:
    // 1. Update the user's credit balance in your database
    // 2. Record the transaction in your database

    console.log(`Successfully verified payment for ${quantity} credits for user ${userId}`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      credits: parseInt(quantity),
      paymentId: paymentId,
      orderId: orderId
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify payment' 
    });
  }
}
