
import styles from '../styles/Review.module.css';
import Image from 'next/image';

const Review = ({ name, review, image }) => {
  return (
    <div className={styles.review}>
      <div className={styles.avatar}>
        <Image src={image} alt={name} width={60} height={60} className={styles.image} />
      </div>
      <p className={styles.text}>{review}</p>
      <h4 className={styles.name}>{name}</h4>
    </div>
  );
};

export default Review;
