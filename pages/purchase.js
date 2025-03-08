
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Page.module.css";

const PurchasePage = () => {
  const router = useRouter();
  const { quantity: initialQuantity } = router.query;
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const MIN_PURCHASE_AMOUNT = 100; // ₹100 minimum purchase
  const CREDIT_PRICE = 10; // ₹10 per credit
  const MIN_CREDITS = Math.ceil(MIN_PURCHASE_AMOUNT / CREDIT_PRICE); // Minimum 10 credits

  // Load initial quantity from URL and enforce minimum
  useEffect(() => {
    if (initialQuantity) {
      const parsedQuantity = parseInt(initialQuantity);
      setQuantity(parsedQuantity < MIN_CREDITS ? MIN_CREDITS : parsedQuantity);
    } else {
      setQuantity(MIN_CREDITS);
    }
  }, [initialQuantity]);

  // Validate quantity against minimum purchase
  useEffect(() => {
    if (quantity < MIN_CREDITS) {
      setErrorMessage(
        `Minimum purchase is ₹${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`,
      );
    } else {
      setErrorMessage("");
    }
  }, [quantity]);

  // Check if user is logged in (simplified - in a real app, you would check auth state)
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      // Simulate checking user auth (replace with your actual auth logic)
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/');
        return;
      }
      
      setUser({
        id: userId,
        email: localStorage.getItem('userEmail') || 'user@example.com',
        name: localStorage.getItem('userName') || 'User'
      });
      setLoading(false);
    };
    
    checkAuth();

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [router]);

  // Check for payment success query parameter
  useEffect(() => {
    if (router.query.payment_success === 'true') {
      // Show success message
      alert('Payment successful! Your credits have been added.');
      // Remove the query parameter after a short delay
      setTimeout(() => {
        router.replace('/dashboard', undefined, { shallow: true });
      }, 1500);
    }
  }, [router]);

  const handleRazorpayPayment = async () => {
    try {
      setPaymentLoading(true);

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load. Please try again later.");
        setPaymentLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!user) {
        alert("Please log in to purchase credits.");
        setPaymentLoading(false);
        router.push("/");
        return;
      }

      // Create order on the server
      const response = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: quantity * CREDIT_PRICE * 100, // Amount in paise
          userId: user.id,
          quantity,
        }),
      });

      const order = await response.json();
      console.log("Order response:", order);

      if (order.error) {
        alert(order.error || "Failed to create order");
        setPaymentLoading(false);
        return;
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Video Loop Streaming",
        description: `Purchase ${quantity} credits`,
        order_id: order.id,
        handler: async function(response) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Invalid payment response');
            }
            
            const verifyResponse = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: user.id,
                quantity,
              }),
            });

            const result = await verifyResponse.json();

            if (verifyResponse.ok && result.success) {
              console.log("Payment successful! Credits added:", result.credits);
              
              // Store the new balance in localStorage (in a real app, this would come from your database)
              const currentBalance = parseInt(localStorage.getItem('creditBalance') || '0');
              localStorage.setItem('creditBalance', (currentBalance + parseInt(quantity)).toString());
              
              router.push("/dashboard?payment_success=true");
            } else {
              console.error("Server verification failed:", result.error);
              alert(
                `Payment verification failed: ${result.error || "Unknown error"}. Please contact support.`,
              );
              setPaymentLoading(false);
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed. Please contact support.");
            setPaymentLoading(false);
          }
        },
        prefill: {
          email: user.email || "",
          name: user.name || "",
        },
        image: "/favicon.svg",
        theme: { color: "#ff0000" },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
          },
        },
        notes: {
          userId: user.id,
          quantity: quantity
        }
      };

      try {
        const razorpay = new window.Razorpay(options);
        
        // Handle errors from Razorpay
        razorpay.on('payment.failed', function(response) {
          console.error('Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description}`);
          setPaymentLoading(false);
        });
        
        razorpay.open();
      } catch (err) {
        console.error('Razorpay initialization error:', err);
        alert('Could not initialize payment gateway. Please try again later.');
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (quantity < MIN_CREDITS) {
      alert(
        `Minimum purchase is ₹${MIN_PURCHASE_AMOUNT} (${MIN_CREDITS} credits)`,
      );
      return;
    }
    await handleRazorpayPayment();
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > MIN_CREDITS ? prev - 1 : MIN_CREDITS));

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
              <p className={styles.subtitle}>
                Secure payment options available
              </p>
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
                <span className={styles.total}>
                  ₹{(quantity * CREDIT_PRICE).toFixed(2)}
                </span>
              </div>
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}
              <div className={styles.minCreditNotice}>
                Minimum purchase: {MIN_CREDITS} credits (₹
                {MIN_PURCHASE_AMOUNT.toFixed(2)})
              </div>
              <div className={styles.paymentOptions}>
                <h3>Secure Payment with Razorpay</h3>
                <p className={styles.paymentInfo}>
                  Click the button below to complete your transaction securely
                  through Razorpay.
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
                    "Pay Now"
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
