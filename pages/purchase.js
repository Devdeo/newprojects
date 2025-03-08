import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import styles from '../styles/Page.module.css';

const PurchasePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quantity, setQuantity] = useState(10);

  const MIN_CREDITS = 10; // Minimum number of credits to purchase
  const CREDIT_PRICE = 10; // ₹10 per credit

  useEffect(() => {
    const checkAuth = () => {
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
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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
          amount: quantity * CREDIT_PRICE * 100, // Amount in smallest currency unit (paise)
          userId: auth.currentUser?.uid || '',
          quantity: quantity,
        }),
      });

      const order = await response.json();
      console.log("Order response:", order);

      if (order.error) {
        alert(order.error);
        setPaymentLoading(false);
        return;
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
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

            const result = await verifyResponse.json();

            if (result.success) {
              // Redirect to dashboard on success
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
        },
        theme: {
          color: '#3399cc',
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
      alert(`Minimum purchase is ₹${MIN_CREDITS * CREDIT_PRICE} (${MIN_CREDITS} credits)`);
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
    <div>
      <Head>
        <title>Purchase Credits - Video Loop Streaming</title>
        <meta name="description" content="Purchase credits" />
      </Head>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.main}>
          <div className={styles.purchaseContainer}>
            <h1 className={styles.title}>Purchase Credits</h1>
            <p className={styles.description}>
              Credits let you process videos on our platform. Each credit costs ₹{CREDIT_PRICE}.
            </p>

            <div className={styles.purchaseForm}>
              <div className={styles.quantityControls}>
                <button 
                  className={styles.quantityButton} 
                  onClick={decreaseQuantity}
                  disabled={quantity <= MIN_CREDITS}
                >-</button>
                <div className={styles.quantityDisplay}>
                  <strong>{quantity}</strong> Credits
                  <p className={styles.priceDisplay}>₹{quantity * CREDIT_PRICE}</p>
                </div>
                <button 
                  className={styles.quantityButton} 
                  onClick={increaseQuantity}
                >+</button>
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