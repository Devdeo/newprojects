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
            Loop Your Videos on YouTube Live
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Stream your videos 24/7 with automated looping system
          </motion.p>
        </motion.section>

        <motion.section 
          className={styles.features}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3>24/7 Streaming</h3>
              <p>Keep your content streaming continuously without interruption</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Easy Setup</h3>
              <p>Simply upload your video and enter your YouTube stream key</p>
            </div>
            <div className={styles.featureCard}>
              <h3>Reliable</h3>
              <p>Automated system ensures your stream stays live</p>
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
            <div className={styles.pricingCard}>
              <h3>Free</h3>
              <div className={styles.price}>$0</div>
              <ul>
                <li>10 Minutes Processing</li>
                <li>50MB File Size</li>
                <li>Basic Support</li>
              </ul>
            </div>
            <div className={styles.pricingCard}>
              <h3>Credit</h3>
              <div className={styles.price}>$2/credit</div>
              <ul>
                <li>1 Hour Processing</li>
                <li>250MB File Size</li>
                <li>Priority Support</li>
                <li>Per Credit</li>
              </ul>
            </div>
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
              name="Alex Chen"
              review="Perfect for my 24/7 music channel! Keeps my content streaming non-stop."
              image="/avatar1.jpg"
            />
            <Review 
              name="Maria Garcia"
              review="Super easy to set up and maintain my meditation livestream!"
              image="/avatar2.jpg"
            />
            <Review 
              name="James Wilson"
              review="Great for educational content. My tutorials run smoothly 24/7."
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