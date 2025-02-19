
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from "framer-motion";

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
      </main>

      <Footer />
    </div>
  );
};

export default Home;
