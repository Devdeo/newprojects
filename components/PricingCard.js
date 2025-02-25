import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from '../styles/PricingCard.module.css';
import LoginForm from './LoginForm';
import { auth } from '../firebase/config';
import { createUserSubscription } from '../firebase/firestore'; // Import Firebase functions

const PricingCard = ({ title, price, features }) => {
  const router = useRouter();
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleGetStarted = async () => {
    if (!auth.currentUser) {
      setShowLoginForm(true);
    } else {
      try {
        // Create subscription (30 days from now)
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
        <span className={styles.currency}>$</span>
        <span className={styles.amount}>{price}</span>
      </div>
      <ul className={styles.features}>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button onClick={handleGetStarted} className={styles.button}>
        Get Started
      </button>
      {showLoginForm && <LoginForm onClose={() => setShowLoginForm(false)} />}
    </div>
  );
};

export default PricingCard;