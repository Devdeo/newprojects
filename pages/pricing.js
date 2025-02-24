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
            title="Basic" 
            price="29" 
            features={['1 User', '10GB Storage', 'Basic Support']}
          />
          <PricingCard 
            title="Pro" 
            price="59" 
            features={['5 Users', '50GB Storage', 'Priority Support', 'Advanced Features']}
          />
          <PricingCard 
            title="Enterprise" 
            price="99" 
            features={['Unlimited Users', '500GB Storage', '24/7 Support', 'Custom Solutions']}
          />
        </div>
      </motion.section>
    </div>
  );
};

export default PricingPage;
