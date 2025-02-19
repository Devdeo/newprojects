
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function Terms() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Terms & Conditions</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>Terms & Conditions</h1>
        <div className={styles.content}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Terms of Service</h2>
          <p>These terms and conditions outline the rules and regulations for the use of our services.</p>
          {/* Add more terms content */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
