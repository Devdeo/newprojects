
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function Privacy() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Privacy Policy - Video Loop Streaming</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>Privacy Policy</h1>
        <div className={styles.content}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Information We Collect</h2>
          <p>We collect information necessary for video streaming services, including:</p>
          <ul>
            <li>Your YouTube stream key</li>
            <li>Video content you upload</li>
            <li>Account information</li>
          </ul>
          <h2>2. How We Use Your Information</h2>
          <p>Your information is used solely for providing our video looping service and maintaining stream quality.</p>
          <h2>3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your stream keys and content.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
