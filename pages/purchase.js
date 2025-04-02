import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "../styles/Page.module.css";
import Script from "next/script";

const PurchasePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [userData, setUserData] = useState(null);
  const PRICE_PER_CREDIT = 10; // ₹10 per credit

  // Fetch quantity from URL query
  useEffect(() => {
    const queryQuantity = parseInt(router.query.quantity);
    if (!isNaN(queryQuantity) && queryQuantity >= 10) {
      setQuantity(queryQuantity);
    }
  }, [router.query.quantity]);

  // Authenticate user and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load Razorpay SDK
  const initializeRazorpay = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Handle payment process
  const handlePayment = async () => {
    if (!user) {
      alert("Please log in to make a purchase");
      router.push("/");
      return;
    }

    if (quantity < 10) {
      alert("Minimum purchase is 10 credits");
      setQuantity(10);
      return;
    }

    setProcessing(true);

    try {
      const sdkLoaded = await initializeRazorpay();
      if (!sdkLoaded) {
        alert("Razorpay SDK failed to load");
        setProcessing(false);
        return;
      }

      const orderResponse = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: quantity * PRICE_PER_CREDIT,
          userId: user.uid,
          quantity,
        }),
      });

      const orderData = await orderResponse.json();
      if (orderData.error) throw new Error(orderData.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "StreamScript",
        description: `Purchase ${quantity} credits`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyData.success) throw new Error(verifyData.error);

            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) throw new Error("User document does not exist.");

            await updateDoc(userRef, { creditBalance: increment(quantity) });

            const transactionsRef = collection(db, "users", user.uid, "wallets");
            await addDoc(transactionsRef, {
              type: "credit_purchase",
              amount: quantity * PRICE_PER_CREDIT,
              quantity,
              timestamp: serverTimestamp(),
            });

            window.location.href = "/dashboard?payment_success=true";
          } catch (error) {
            console.error("Payment verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: userData?.name || user.displayName || "",
          email: user.email || "",
        },
        theme: { color: "#3B82F6" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on("payment.failed", (response) => {
        alert(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
    } catch (error) {
      console.error("Error creating order:", error);
      alert(`Failed to process payment: ${error.message}`);
      setProcessing(false);
    }
  };

  const totalAmount = quantity * PRICE_PER_CREDIT;

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Purchase Credits - Loop Live</title>
        <meta name="description" content="Purchase credits" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      <main className={styles.main} style={{ color: 'black' }}>
        <div className={styles.purchaseContainer}>
          <h1 className={styles.title}>Purchase Credits</h1>
          <div className={styles.creditInfo}>
            <p>Credits are used to pay for streaming time. Each credit allows for 1 hour of streaming.</p>
            <p>
              Current credit balance: <strong>{userData?.creditBalance || 0}</strong>
            </p>
          </div>

          <div className={styles.purchaseCard}>
            <div className={styles.quantitySelector}>
              <h3>Select Quantity</h3>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => setQuantity(Math.max(10, quantity - 5))}
                  disabled={quantity <= 10}
                  className={styles.quantityButton}
                >
                  -
                </button>
                <input
                  type="number"
                  min="10"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setQuantity(!isNaN(value) && value >= 10 ? value : 10);
                  }}
                  className={styles.quantityInput}
                />
                <button
                  onClick={() => setQuantity(quantity + 5)}
                  className={styles.quantityButton}
                >
                  +
                </button>
              </div>
              <p className={styles.minimumNotice}>Minimum purchase: 10 credits</p>
            </div>

            <div className={styles.priceSummary}>
              <div className={styles.priceRow}>
                <span>Price per credit:</span>
                <span>₹{PRICE_PER_CREDIT.toFixed(2)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Quantity:</span>
                <span>{quantity} credits</span>
              </div>
              <div className={`${styles.priceRow} ${styles.total}`}>
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              className={styles.paymentButton}
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchasePage;
