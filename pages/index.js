
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import Review from '../components/Review';

const Home = () => {
  const pricingPlans = [
    {
      title: 'Basic',
      price: '29',
      features: ['Feature 1', 'Feature 2', 'Feature 3']
    },
    {
      title: 'Pro',
      price: '59',
      features: ['All Basic Features', 'Feature 4', 'Feature 5', 'Feature 6']
    },
    {
      title: 'Enterprise',
      price: '99',
      features: ['All Pro Features', 'Feature 7', 'Feature 8', 'Priority Support']
    }
  ];

  const reviews = [
    {
      name: 'John Doe',
      review: 'Amazing service! Exactly what I needed for my business.',
      image: '/avatar1.jpg'
    },
    {
      name: 'Jane Smith',
      review: 'The best digital service provider I have worked with.',
      image: '/avatar2.jpg'
    },
    {
      name: 'Mike Johnson',
      review: 'Outstanding support and excellent features.',
      image: '/avatar3.jpg'
    }
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Digital Services - Home</title>
        <meta name="description" content="Digital services for your business" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Transform Your Digital Presence</h1>
          <p>Professional digital services for modern businesses</p>
        </section>

        <section className={styles.pricing}>
          <h2>Pricing Plans</h2>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </section>

        <section className={styles.reviews}>
          <h2>Customer Reviews</h2>
          <div className={styles.reviewGrid}>
            {reviews.map((review, index) => (
              <Review key={index} {...review} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
