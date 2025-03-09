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
  query,
  where,
  getDocs,
} from "firebase/firestore";
import crypto from "crypto";
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

  // Get quantity from URL query if available
  useEffect(() => {
    if (router.query.quantity) {
      const queryQuantity = parseInt(router.query.quantity);
      if (!isNaN(queryQuantity) && queryQuantity >= 10) {
        setQuantity(queryQuantity);
      }
    }
  }, [router.query.quantity]);

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

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };
  const update = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      // Make sure the user document exists
      if (!docSnap.exists()) {
        throw new Error("User document does not exist.");
      }

      // Update the user's credit balance
      await updateDoc(userRef, {
        creditBalance: increment(quantity),
      });

      // Reference the subcollection using the full path
      const transactionsRef = collection(db, "users", user.uid, "wallets");

      // Add the transaction record to the subcollection
      await addDoc(transactionsRef, {
        type: "credit_purchase",
        amount: quantity * PRICE_PER_CREDIT,
        quantity: quantity,
        timestamp: serverTimestamp(),
      });

      // Redirect to dashboard with success message
    } catch (error) {
      alert(error.message);
      alert("Something went wrong. Please try again later.");
    }
  };

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
      // Initialize Razorpay
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK Failed to load");
        setProcessing(false);
        return;
      }

      // Create order on the server
      const orderResponse = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: quantity * PRICE_PER_CREDIT,
          userId: user.uid,
          quantity: quantity,
        }),
      });

      const orderData = await orderResponse.json();
      console.log("Order response:", orderData);

      if (orderData.error) {
        throw new Error(orderData.error);
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "StreamScript",
        description: `Purchase ${quantity} credits`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Send verification request to our API
            const verifyResponse = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success != true) {
              throw new Error(
                verifyData.error || "Payment verification failed",
              );
            }

            // Query the user document by UID to get updated data

            update();
            // Redirect to dashboard with success message
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
        theme: {
          color: "#3399cc",
        },
      };

      // Initialize and open Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      // Handle payment failure
      razorpay.on("payment.failed", function (response) {
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

  if (loading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Purchase Credits - StreamScript</title>
        <meta
          name="description"
          content="Purchase credits for your streaming needs"
        />
      </Head>

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <Navbar />

      <main className={styles.main}>
        <div className={styles.purchaseContainer}>
          <h1 className={styles.title}>Purchase Credits</h1>

          <div className={styles.creditInfo}>
            <p>
              Credits are used to pay for streaming time. Each credit allows for
              1 hour of streaming.
            </p>
            <p>
              Current credit balance:{" "}
              <strong>{userData?.creditBalance || 0}</strong>
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
                    if (!isNaN(value) && value >= 10) {
                      setQuantity(value);
                    } else if (!isNaN(value) && value < 10) {
                      setQuantity(10);
                    }
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
              <p className={styles.minimumNotice}>
                Minimum purchase: 10 credits
              </p>
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

          <div className={styles.securityNote}>
            <p>
              All payments are secure and encrypted. We use Razorpay for payment
              processing.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PurchasePage;
