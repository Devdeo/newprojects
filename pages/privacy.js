
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function Privacy() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Privacy Policy</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>Privacy Policy</h1>
        <div className={styles.content}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us...</p>
          {/* Add more privacy policy content */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
