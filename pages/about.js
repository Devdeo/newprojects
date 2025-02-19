
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <Head>
        <title>About Us</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>About Us</h1>
        <div className={styles.content}>
          <h2>Our Story</h2>
          <p>We are dedicated to providing the best digital services...</p>
          {/* Add more about content */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
