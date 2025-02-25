import { motion } from "framer-motion";
import styles from "../styles/Home.module.css";
import Head from 'next/head';
import PricingCard from '../components/PricingCard';
import Navbar from '../components/Navbar';

const PricingPage = () => {
  return (
    <div>
      <Head>
        <title>Dashboard - My Site</title>
        <meta name="description" content="User dashboard" />
      </Head>
      <Navbar />
      <motion.section 
        className={styles.pricing}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <h2>Pricing Plans</h2>
        <div className={styles.pricingGrid}>
          <PricingCard 
            title="Free" 
            price="0" 
            features={['10 Minutes Processing', '50MB File Size', 'Basic Support']}
          />
          <PricingCard 
            title="Credit" 
            price="2" 
            features={['1 Hour Processing', '250MB File Size', 'Priority Support', 'Per Credit']}
          />
        </div>
      </motion.section>
    </div>
  );
};

export default PricingPage;
