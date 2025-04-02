import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../styles/PricingCard.module.css';
import LoginForm from './LoginForm';
import { auth } from '../firebase/config';

import { onAuthStateChanged } from 'firebase/auth';

const PricingCard = ({ title, price, features }) => {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const MIN_CREDITS = 10; // Minimum ₹100 purchase at ₹10 per credit
  
  const handleBuyCredits = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!user.emailVerified && user.providerData[0].providerId === 'password') {
      alert('Please verify your email before making a purchase. Check your inbox for the verification link.');
      return;
    }

    try {
      // Ensure minimum purchase quantity
      const purchaseQuantity = Math.max(quantity, MIN_CREDITS);
      router.push(`/purchase?quantity=${purchaseQuantity}`);
    } catch (error) {
      console.error('Error navigating to purchase:', error);
      alert('Failed to proceed to purchase. Please try again.');
    }
  };

  const handleGetStarted = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!user.emailVerified && user.providerData[0].providerId === 'password') {
      alert('Please verify your email before getting started. Check your inbox for the verification link.');
      return;
    }

    try {
      if (title === "Credit") {
        // Ensure minimum purchase quantity
        const purchaseQuantity = Math.max(quantity, MIN_CREDITS);
        router.push(`/purchase?quantity=${purchaseQuantity}`);
      } else {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        await createUserSubscription(auth.currentUser.uid, title, expiryDate);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error handling plan:', error);
      alert('Failed to process request. Please try again.');
    }
  };

  return (
    <div className={styles.card} style={{ padding: '2rem', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', transition: 'transform 0.3s ease' }}>
      <h3 style={{ fontSize: '1.5rem', color: '#1f2937' }}>{title}</h3>
      <div className={styles.price} style={{ fontSize: '2rem', color: '#3b82f6', margin: '1rem 0' }}>
        {title === "Free" ? "Free" : `₹${price}/credit`}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280', lineHeight: '1.75' }}>
        {features.map((feature, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>{feature}</li>
        ))}
      </ul>
      {user && title === "Credit" && (
        <div className={styles.creditControls}>
          <div className={styles.quantityControl}>
            <button onClick={() => setQuantity(Math.max(MIN_CREDITS, quantity - 1))} className={styles.quantityButton}>-</button>
            <span className={styles.quantity}>{Math.max(MIN_CREDITS, quantity)}</span>
            <button onClick={() => setQuantity(quantity + 1)} className={styles.quantityButton}>+</button>
          </div>
          <button onClick={handleBuyCredits} className={`${styles.button} ${styles.payButton}`}>
            Buy {Math.max(MIN_CREDITS, quantity)} Credit{Math.max(MIN_CREDITS, quantity) > 1 ? 's' : ''}
          </button>
          <div className={styles.minCreditNotice}>
            Minimum purchase: {MIN_CREDITS} credits (₹{(MIN_CREDITS * 10).toFixed(2)})
          </div>
        </div>
      )}
      {user && title === "Free" && (
        <div className={styles.freeInfo}>
          <p>Start using your free plan in dashboard</p>
        </div>
      )}
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default PricingCard;
