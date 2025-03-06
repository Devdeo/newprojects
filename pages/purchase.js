
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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    ifsc: '',
  });

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

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentLoading(false);
      alert("Payment Successful! Thank you for your purchase.");
      router.push('/dashboard');
    }, 2000);
  };

  const renderPaymentForm = () => {
    switch(paymentMethod) {
      case 'card':
        return (
          <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
            <div className={styles.formGroup}>
              <label htmlFor="cardName">Cardholder Name</label>
              <input 
                type="text" 
                id="cardName" 
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                placeholder="John Doe"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cardNumber">Card Number</label>
              <input 
                type="text" 
                id="cardNumber" 
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="cardExpiry">Expiry Date</label>
                <input 
                  type="text" 
                  id="cardExpiry" 
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cardCVV">CVV</label>
                <input 
                  type="text" 
                  id="cardCVV" 
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
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
                'Pay Now'
              )}
            </button>
          </form>
        );
      case 'upi':
        return (
          <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
            <div className={styles.formGroup}>
              <label htmlFor="upiId">UPI ID</label>
              <input 
                type="text" 
                id="upiId" 
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@upi"
                required
              />
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
                'Pay Now'
              )}
            </button>
          </form>
        );
      case 'netbanking':
        return (
          <form onSubmit={handleSubmitPayment} className={styles.paymentForm}>
            <div className={styles.formGroup}>
              <label htmlFor="bankName">Bank Name</label>
              <select 
                id="bankName" 
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                required
              >
                <option value="">Select Bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="pnb">Punjab National Bank</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Account Number</label>
              <input 
                type="text" 
                id="accountNumber" 
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                placeholder="Account Number"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ifsc">IFSC Code</label>
              <input 
                type="text" 
                id="ifsc" 
                value={bankDetails.ifsc}
                onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                placeholder="IFSC Code"
                required
              />
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
                'Pay Now'
              )}
            </button>
          </form>
        );
      case 'paypal':
        return (
          <div className={styles.paypalContainer}>
            <div ref={paypalButtonRef} className={styles.paypalButtonContainer}></div>
          </div>
        );
      default:
        return null;
    }
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
                <h3>Payment Methods</h3>
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
                  <button 
                    className={`${styles.methodButton} ${paymentMethod === 'paypal' ? styles.methodButtonActive : ''}`}
                    onClick={() => setPaymentMethod('paypal')}
                    type="button"
                  >
                    PayPal
                  </button>
                </div>
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
