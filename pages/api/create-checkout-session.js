
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Stripe with secret key from environment variables
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const { quantity, unitPrice, paymentMethod } = req.body;
    
    // Calculate total amount in smallest currency unit (cents)
    const amount = Math.round(quantity * unitPrice * 100);
    
    // Set payment method options based on selected method
    let payment_method_types = ['card'];
    
    if (paymentMethod === 'upi') {
      payment_method_types.push('upi');
    } else if (paymentMethod === 'netbanking') {
      // For Indian netbanking, we use the bank_transfer payment method
      payment_method_types.push('bank_transfer');
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Credits',
              description: `${quantity} credits for video processing`,
            },
            unit_amount: Math.round(unitPrice * 100), // Convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/dashboard?payment_success=true`,
      cancel_url: `${req.headers.origin}/purchase?quantity=${quantity}`,
      metadata: {
        userId: req.body.userId || '',
        quantity: quantity
      }
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
