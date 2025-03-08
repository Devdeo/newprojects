
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

    // Update user's credit balance via API
    try {
      const updateUserResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${userId}/update-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits: parseInt(quantity),
          amount: parseInt(amount) / 100, // Convert paise to INR
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        }),
      });

      const userData = await updateUserResponse.json();
      
      if (userData.error) {
        throw new Error(userData.error);
      }

      return res.status(200).json({ 
        success: true,
        message: 'Payment verified and credits added successfully',
        newBalance: userData.newBalance
      });
    } catch (updateError) {
      console.error('Error updating user credits:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update user credits', 
        message: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Payment verification failed', 
      message: error.message 
    });
  }
}
