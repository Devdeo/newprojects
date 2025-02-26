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
  const [paymentLoading, setPaymentLoading] = useState(false); // Added state for payment loading

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

    setPaymentLoading(true); // Use correct loading state
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
      setPaymentLoading(false); // Use correct loading state
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
        <div className={styles.purchaseCard}>
          <h1>Purchase Credits</h1>
          <div className={styles.purchaseDetails}>
            <p>Quantity: {quantity || 1} credit(s)</p>
            <p>Total: ${(quantity || 1) * 2}</p>
            <button 
              className={styles.payButton}
              onClick={makePayment}
              disabled={paymentLoading} // Use correct loading state
            >
              {paymentLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchasePage;