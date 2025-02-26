
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import styles from '../styles/Home.module.css';

const PurchasePage = () => {
  const router = useRouter();
  const { quantity } = router.query;

  return (
    <div>
      <Head>
        <title>Purchase Credits - My Site</title>
        <meta name="description" content="Purchase credits" />
      </Head>
      <Navbar />
      <div className={styles.container}>
        <h1>Purchase Credits</h1>
        <div className={styles.purchaseDetails}>
          <p>Quantity: {quantity || 1} credit(s)</p>
          <p>Total: ${(quantity || 1) * 2}</p>
          {/* Add your payment integration here */}
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
