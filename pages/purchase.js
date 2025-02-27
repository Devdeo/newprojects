
import { useRouter } from 'next/router';
import Head from 'next/head';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/Page.module.css';

const PurchasePage = () => {
  const router = useRouter();
  const { quantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const makePayment = async () => {
    const res = await initializeRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }

    setPaymentLoading(true);
    try {
      const amount = (quantity || 1) * 2 * 100;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: amount,
        currency: "INR",
        name: "Credit Purchase",
        description: `Purchase ${quantity || 1} credits`,
        handler: function (response) {
          alert("Payment Successful!");
          router.push('/dashboard');
        },
        prefill: {
          email: "user@example.com",
        },
        theme: {
          color: "#38bdf8",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push('/');
        }
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
              <p className={styles.subtitle}>Secure payment powered by Razorpay</p>
            </div>
            <div className={styles.purchaseDetails}>
              <div className={styles.detailRow}>
                <span>Quantity</span>
                <span>{quantity || 1} credit(s)</span>
              </div>
              <div className={styles.detailRow}>
                <span>Price per credit</span>
                <span>$2.00</span>
              </div>
              <div className={styles.detailRow}>
                <span>Total amount</span>
                <span className={styles.total}>${(quantity || 1) * 2}.00</span>
              </div>
              <button 
                className={styles.payButton}
                onClick={makePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <span className={styles.loadingSpinner}></span>
                ) : (
                  'Complete Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchasePage;
