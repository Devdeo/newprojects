
import styles from '../styles/PricingCard.module.css';

const PricingCard = ({ title, price, features }) => {
  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <div className={styles.price}>${price}/mo</div>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <button className={styles.button}>Get Started</button>
    </div>
  );
};

export default PricingCard;
