import { motion } from "framer-motion";
import styles from "../styles/Home.module.css";
import Head from 'next/head';
import PricingCard from '../components/PricingCard';
import Navbar from '../components/Navbar';

const PricingPage = () => {
  return (
    <div>
      <Head>
        <title>Pricing - Loop Live on youtube</title>
        <meta name="Loop Live" content="pricing" />
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
            price="10" 
            features={['1 Hour Processing', '1GB File Size', 'Priority Support', 'Per Credit', 'Minimum 10 Credits (₹100)']}
          />
        </div>
      </motion.section>
    </div>
  );
};

export default PricingPage;
