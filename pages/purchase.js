import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/Page.module.css';

const PurchasePage = () => {
  const router = useRouter();
  const { quantity: initialQuantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quantity, setQuantity] = useState(10);

  const [errorMessage, setErrorMessage] = useState('');
  const MIN_PURCHASE_AMOUNT = 100; // ₹100 minimum purchase
  const CREDIT_PRICE = 10; // ₹10 per credit
  const MIN_CREDITS = Math.ceil(MIN_PURCHASE_AMOUNT / CREDIT_PRICE); // Minimum 10 credits

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
      setErrorMessage(`Minimum purchase is ₹${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`);
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

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleRazorpayPayment = async () => {
    try {
      setPaymentLoading(true);

      // Create order on the server
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: quantity * CREDIT_PRICE * 100, // Amount in smallest currency unit (cents)
          userId: auth.currentUser?.uid || '',
          quantity: quantity,
        }),
      });

      const order = await response.json();

      if (order.error) {
        alert(order.error);
        setPaymentLoading(false);
        return;
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Video Loop Streaming',
        description: `Purchase ${quantity} credits`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on the server
            const verifyResponse = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: auth.currentUser?.uid || '',
                quantity: quantity,
              }),
            });

            const data = await verifyResponse.json();

            if (data.success) {
              router.push('/dashboard?payment_success=true');
            } else {
              alert('Payment verification failed. Please contact support.');
              setPaymentLoading(false);
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support.');
            setPaymentLoading(false);
          }
        },
        prefill: {
          email: auth.currentUser?.email || '',
          name: auth.currentUser?.displayName || '',
        },
        theme: {
          color: '#ff0000',
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

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

    // Create Razorpay payment
    await handleRazorpayPayment();
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => prev > MIN_CREDITS ? prev - 1 : MIN_CREDITS);
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
                <span>₹{CREDIT_PRICE.toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total amount</span>
                <span className={styles.total}>₹{(quantity * CREDIT_PRICE).toFixed(2)}</span>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}
              <div className={styles.minCreditNotice}>
                Minimum purchase: {MIN_CREDITS} credits (₹{MIN_PURCHASE_AMOUNT.toFixed(2)})
              </div>

              <div className={styles.paymentOptions}>
                <h3>Secure Payment with Razorpay</h3>
                <p className={styles.paymentInfo}>
                  Click the button below to complete your transaction securely through Razorpay.
                </p>
              </div>

              {!loading && (
                <button 
                  onClick={handleSubmitPayment} 
                  className={styles.payButton}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              )}

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