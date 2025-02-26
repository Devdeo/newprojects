
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../styles/PricingCard.module.css';
import LoginForm from './LoginForm';
import { auth } from '../firebase/config';
import { createUserSubscription } from '../firebase/firestore';
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

  const handleGetStarted = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (title === "Credit") {
      router.push('/dashboard');
    } else {
      try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        await createUserSubscription(auth.currentUser.uid, title, expiryDate);
        router.push('/dashboard');
      } catch (error) {
        console.error('Error purchasing plan:', error);
        alert('Failed to process purchase. Please try again.');
      }
    }
  };

  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <div className={styles.price}>
        ${price}{title === "Free" ? "" : "/credit"}
      </div>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      {user && title === "Credit" && (
        <div className={styles.creditControls}>
          <div className={styles.quantityControl}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={styles.quantityButton}>-</button>
            <span className={styles.quantity}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className={styles.quantityButton}>+</button>
          </div>
          <button onClick={handleBuyCredits} className={styles.button}>
            Buy {quantity} Credit{quantity > 1 ? 's' : ''}
          </button>
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
