
import styles from '../styles/Review.module.css';
import Image from 'next/image';

const Review = ({ name, review, image, rating }) => {
  return (
    <div className={styles.review}>
      <div className={styles.avatar}>
        <Image src={image} alt={name} width={60} height={60} className={styles.image} />
      </div>
      <div className={styles.stars}>
        {[...Array(5)].map((_, index) => (
          <span 
            key={index} 
            className={`${styles.star} ${index < rating ? styles.filled : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <p className={styles.text}>{review}</p>
      <h4 className={styles.name}>{name}</h4>
    </div>
  );
};

export default Review;
