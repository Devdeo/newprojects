
import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from '../styles/PricingCard.module.css';
import LoginForm from './LoginForm';

const PricingCard = ({ title, price, features }) => {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // In real app, get from auth context

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
    } else {
      router.push('/dashboard');
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
