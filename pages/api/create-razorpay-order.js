
import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, quantity } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(amount), // Amount in smallest currency unit (cents)
      currency: 'USD',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId: userId,
        quantity: quantity,
      },
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
