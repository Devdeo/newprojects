
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <Head>
        <title>About - Video Loop Streaming</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>About Us</h1>
        <div className={styles.content}>
          <p>We provide a seamless solution for content creators who want to maintain a 24/7 presence on YouTube Live through automated video looping.</p>
          <h2>Our Mission</h2>
          <p>To simplify continuous streaming for content creators, enabling them to reach their audience around the clock without manual intervention.</p>
          <h2>How It Works</h2>
          <p>Upload your video, enter your YouTube stream key, and our system handles the rest - keeping your content streaming continuously with professional quality.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
