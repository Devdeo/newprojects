
import Stripe from 'stripe';
import { db } from '../../firebase/config';
import { doc, updateDoc, increment } from 'firebase/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { amount, userId, quantity } = req.body;
      
      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // Amount in cents
        currency: 'usd',
        metadata: {
          userId,
          quantity,
          integration_check: 'accept_a_payment',
        },
      });
      
      // Return the client secret to the client
      res.status(200).json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        error: 'Failed to create payment intent. Please try again.' 
      });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
