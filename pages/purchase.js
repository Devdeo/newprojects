
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../components/Navbar';
import styles from '../styles/Page.module.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PurchasePage = () => {
  const router = useRouter();
  const { quantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [errorMessage, setErrorMessage] = useState('');
  const MIN_PURCHASE_AMOUNT = 10; // $10 minimum purchase
  const CREDIT_PRICE = 0.5; // $0.50 per credit
  const MIN_CREDITS = Math.ceil(MIN_PURCHASE_AMOUNT / CREDIT_PRICE); // Minimum 20 credits

  useEffect(() => {
    // Validate minimum purchase amount when quantity changes
    if (quantity && parseInt(quantity) < MIN_CREDITS) {
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
          quantity: parseInt(quantity || MIN_CREDITS),
          unitPrice: CREDIT_PRICE,
          paymentMethod: paymentMethod,
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
    if (parseInt(quantity || 1) < MIN_CREDITS) {
      alert(`Minimum purchase is $${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`);
      return;
    }
    
    // Create Stripe checkout session
    await createCheckoutSession();
  };

  const renderPaymentForm = () => {
    return (
      <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
        <div className={styles.paymentMethodSelector}>
          <button 
            className={`${styles.methodButton} ${paymentMethod === 'card' ? styles.methodButtonActive : ''}`}
            onClick={() => setPaymentMethod('card')}
            type="button"
          >
            Credit/Debit Card
          </button>
          <button 
            className={`${styles.methodButton} ${paymentMethod === 'upi' ? styles.methodButtonActive : ''}`}
            onClick={() => setPaymentMethod('upi')}
            type="button"
          >
            UPI
          </button>
          <button 
            className={`${styles.methodButton} ${paymentMethod === 'netbanking' ? styles.methodButtonActive : ''}`}
            onClick={() => setPaymentMethod('netbanking')}
            type="button"
          >
            Net Banking
          </button>
        </div>
        <button 
          type="submit" 
          className={styles.payButton}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <>
              <span className={styles.loadingSpinner}></span>
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      </form>
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
                <span>{quantity || MIN_CREDITS} credit(s)</span>
              </div>
              <div className={styles.detailRow}>
                <span>Price per credit</span>
                <span>${CREDIT_PRICE.toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total amount</span>
                <span className={styles.total}>${((quantity || MIN_CREDITS) * CREDIT_PRICE).toFixed(2)}</span>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}
              
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
