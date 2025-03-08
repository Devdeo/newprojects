
const Razorpay = require("razorpay");
const shortid = require("shortid");

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

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay API keys not found');
      return res.status(500).json({ error: 'Razorpay configuration is missing' });
    }

    // Create order with proper options
    const payment_capture = 1;
    const options = {
      amount: Math.round(amount), // Amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${shortid.generate()}`,
      payment_capture,
      notes: {
        userId: userId,
        quantity: quantity,
      },
    };

    // Create order
    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
