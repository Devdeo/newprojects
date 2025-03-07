
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import styles from '../styles/Page.module.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PurchasePage = () => {
  const router = useRouter();
  const { quantity: initialQuantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [quantity, setQuantity] = useState(20);
  
  const [errorMessage, setErrorMessage] = useState('');
  const MIN_PURCHASE_AMOUNT = 10; // $10 minimum purchase
  const CREDIT_PRICE = 0.5; // $0.50 per credit
  const MIN_CREDITS = Math.ceil(MIN_PURCHASE_AMOUNT / CREDIT_PRICE); // Minimum 20 credits

  useEffect(() => {
    // Set initial quantity from URL parameter, ensuring it meets minimum
    if (initialQuantity) {
      const parsedQuantity = parseInt(initialQuantity);
      setQuantity(parsedQuantity < MIN_CREDITS ? MIN_CREDITS : parsedQuantity);
    } else {
      setQuantity(MIN_CREDITS);
    }
  }, [initialQuantity]);

  useEffect(() => {
    // Validate minimum purchase amount when quantity changes
    if (quantity < MIN_CREDITS) {
      setErrorMessage(`Minimum purchase is $${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`);
    } else {
      setErrorMessage('');
    }
  }, [quantity]);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push('/');
          return;
        }
        
        // Check if email verification is required (doesn't apply to OAuth providers)
        const isEmailProvider = user.providerData[0]?.providerId === 'password';
        if (isEmailProvider && !user.emailVerified) {
          router.push('/dashboard');
          return;
        }
        
        setLoading(false);
      });
      return () => unsubscribe();
    };
    checkAuth();
  }, []);

  const createCheckoutSession = async () => {
    try {
      setPaymentLoading(true);
      
      // Fetch checkout session from your server
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: quantity,
          unitPrice: CREDIT_PRICE,
          paymentMethod: paymentMethod,
          userId: auth.currentUser?.uid || '',
        }),
      });
      
      const session = await response.json();
      
      if (session.error) {
        alert(session.error);
        setPaymentLoading(false);
        return;
      }
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (error) {
        alert(error.message);
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    // Check minimum purchase amount
    if (quantity < MIN_CREDITS) {
      alert(`Minimum purchase is $${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`);
      return;
    }
    
    // Create Stripe checkout session
    await createCheckoutSession();
  };
  
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => prev > MIN_CREDITS ? prev - 1 : MIN_CREDITS);
  };

  // Stripe CardElement checkout form component
  const CheckoutForm = ({ quantity, totalAmount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const handleSubmit = async (event) => {
      event.preventDefault();
      
      if (!stripe || !elements) {
        return;
      }
      
      setProcessing(true);
      setError('');
      
      try {
        // Create payment intent on the server
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: Math.round(totalAmount * 100), // Convert to cents
            userId: auth.currentUser?.uid || '',
            quantity: quantity
          }),
        });
        
        const { clientSecret, error: intentError } = await response.json();
        
        if (intentError) {
          setError(intentError);
          setProcessing(false);
          return;
        }
        
        // Confirm card payment with Stripe
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: elements.getElement(CardElement) }
        });
        
        if (result.error) {
          setError(result.error.message);
          setProcessing(false);
        } else {
          // Payment successful, redirect to dashboard
          router.push('/dashboard?payment_success=true');
        }
      } catch (err) {
        console.error('Payment error:', err);
        setError('An unexpected error occurred. Please try again.');
        setProcessing(false);
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className={styles.paymentForm}>
        <div className={styles.cardElementContainer}>
          <label className={styles.cardLabel}>
            Card Details
          </label>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#fff',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
              },
            }}
            className={styles.cardElement}
          />
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <button 
          type="submit" 
          className={styles.payButton}
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <span className={styles.loadingSpinner}></span>
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </form>
    );
  };
  
  const renderPaymentForm = () => {
    const totalAmount = quantity * CREDIT_PRICE;
    
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm quantity={quantity} totalAmount={totalAmount} />
      </Elements>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Purchase Credits - My Site</title>
        <meta name="description" content="Purchase credits" />
      </Head>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.purchaseWrapper}>
          <div className={styles.purchaseCard}>
            <div className={styles.purchaseHeader}>
              <h1>Purchase Credits</h1>
              <p className={styles.subtitle}>Secure payment options available</p>
            </div>
            <div className={styles.purchaseDetails}>
              <div className={styles.detailRow}>
                <span>Quantity</span>
                <div className={styles.quantityControl}>
                  <button 
                    type="button" 
                    onClick={decreaseQuantity}
                    className={styles.quantityButton}
                    disabled={quantity <= MIN_CREDITS}
                  >
                    -
                  </button>
                  <span className={styles.quantity}>{quantity} credit(s)</span>
                  <button 
                    type="button" 
                    onClick={increaseQuantity}
                    className={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span>Price per credit</span>
                <span>${CREDIT_PRICE.toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total amount</span>
                <span className={styles.total}>${(quantity * CREDIT_PRICE).toFixed(2)}</span>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}
              <div className={styles.minCreditNotice}>
                Minimum purchase: {MIN_CREDITS} credits (${MIN_PURCHASE_AMOUNT.toFixed(2)})
              </div>
              
              <div className={styles.paymentOptions}>
                <h3>Secure Payment with Stripe</h3>
                <p className={styles.paymentInfo}>
                  Select your preferred payment method. You'll be redirected to Stripe's secure payment page to complete your transaction.
                </p>
              </div>
              
              {/* Payment form based on selected method */}
              {!loading && renderPaymentForm()}
              
              {loading && (
                <div className={styles.loadingContainer}>
                  <span className={styles.loadingSpinner}></span>
                  <p>Loading payment options...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchasePage;
