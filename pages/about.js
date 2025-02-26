
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
          <section className={styles.section}>
            <h2>Welcome to Video Loop Streaming</h2>
            <p>Your premier destination for seamless 24/7 YouTube Live streaming through automated video looping. We empower content creators to maintain a constant presence on their channels without the complexity of manual streaming.</p>
          </section>

          <section className={styles.section}>
            <h2>Our Mission</h2>
            <p>We're dedicated to simplifying continuous streaming for content creators, making it effortless to reach your audience around the clock. Our goal is to provide reliable, innovative tools that help you maintain an active channel presence without being tied to your computer.</p>
          </section>

          <section className={styles.section}>
            <h2>What We Do</h2>
            <ul>
              <li><strong>24/7 Automated Streaming:</strong> Our platform keeps your content streaming continuously without interruption</li>
              <li><strong>Easy Setup:</strong> Simply upload your video and enter your YouTube stream key - we handle the rest</li>
              <li><strong>Professional Quality:</strong> Maintain high-quality streams that keep your audience engaged</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Our Values</h2>
            <ul>
              <li><strong>Innovation:</strong> We continuously improve our technology to provide the best streaming experience</li>
              <li><strong>Reliability:</strong> Our robust infrastructure ensures your streams stay live 24/7</li>
              <li><strong>Simplicity:</strong> We believe great technology should be easy to use</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Get Started</h2>
            <p>Join thousands of content creators who trust us with their continuous streaming needs. Transform your YouTube channel with professional, uninterrupted content delivery today.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
