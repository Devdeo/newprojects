import Head from "next/head";
import styles from "../styles/Home.module.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from "framer-motion";
import PricingCard from '../components/PricingCard';
import Review from '../components/Review';

const Home = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Digital Services - Home</title>
        <meta name="description" content="Digital services for your business" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <motion.section 
          className={styles.hero}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Transform Your Digital Presence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Professional digital services for modern businesses
          </motion.p>
          <motion.button 
            className={styles.cta}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </motion.section>

        <motion.section 
          className={styles.features}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3>Fast & Reliable</h3>
              <p>Lightning-fast performance that keeps your business running smoothly</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Secure</h3>
              <p>Enterprise-grade security to protect your valuable data</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Scalable</h3>
              <p>Grows with your business, from startup to enterprise</p>
            </div>
          </div>
        </motion.section>

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

        <motion.section 
          className={styles.reviews}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <h2>What Our Customers Say</h2>
          <div className={styles.reviewGrid}>
            <Review 
              name="John Doe"
              review="Amazing service! The platform has transformed how we handle our digital presence."
              image="/avatar1.jpg"
            />
            <Review 
              name="Sarah Smith"
              review="Incredible features and outstanding support. Highly recommended!"
              image="/avatar2.jpg"
            />
            <Review 
              name="Mike Johnson"
              review="Best decision we made for our business. The ROI has been phenomenal."
              image="/avatar3.jpg"
            />
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;