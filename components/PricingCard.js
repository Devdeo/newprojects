import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from '../styles/PricingCard.module.css';
import LoginForm from './LoginForm';
import { auth, createUserSubscription } from '../firebase'; // Import Firebase functions

const PricingCard = ({ title, price, features }) => {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // In real app, get from auth context

  const handleGetStarted = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

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
  };

  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <div className={styles.price}>${price}/mo</div>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button onClick={handleGetStarted} className={styles.button}>
        {isLoggedIn ? 'Access Dashboard' : 'Get Started'}
      </button>
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default PricingCard;