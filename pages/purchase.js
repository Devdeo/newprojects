
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/Page.module.css';

const PurchasePage = () => {
  const router = useRouter();
  const { quantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const paypalButtonRef = useRef(null);

  useEffect(() => {
    const loadPayPalScript = () => {
      // Load the PayPal script
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => initializePayPalButton();
      document.body.appendChild(script);
    };

    const initializePayPalButton = () => {
      if (paypalButtonRef.current && window.paypal) {
        // Clear any existing buttons
        paypalButtonRef.current.innerHTML = '';
        
        window.paypal.Buttons({
          style: {
            color: 'blue',
            shape: 'pill',
            label: 'pay'
          },
          createOrder: (data, actions) => {
            const amount = (quantity || 1) * 0.5;
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount.toFixed(2),
                  currency_code: 'USD'
                },
                description: `Purchase ${quantity || 1} credits`
              }]
            });
          },
          onApprove: (data, actions) => {
            return actions.order.capture().then(function(details) {
              alert("Payment Successful! Thank you for your purchase.");
              router.push('/dashboard');
            });
          },
          onError: (err) => {
            console.error('Payment error:', err);
            alert('Payment failed. Please try again.');
          }
        }).render(paypalButtonRef.current);
      }
    };

    // Check if quantity is available (router query might not be available immediately)
    if (quantity) {
      loadPayPalScript();
    }
  }, [quantity, router]);

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
                <span>{quantity || 1} credit(s)</span>
              </div>
              <div className={styles.detailRow}>
                <span>Price per credit</span>
                <span>$0.50</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total amount</span>
                <span className={styles.total}>${(quantity || 1) * 0.5}.00</span>
              </div>
              
              <div className={styles.paymentOptions}>
                <h3>Payment Options</h3>
                <div className={styles.paymentIcons}>
                  <span>Credit/Debit Cards</span>
                  <span>Net Banking</span>
                  <span>UPI</span>
                </div>
              </div>
              
              {/* PayPal button container */}
              <div ref={paypalButtonRef} className={styles.paypalButtonContainer}></div>
              
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
