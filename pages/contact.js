import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function Contact() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Contact Us</title>
      </Head>
      <Navbar />
      <main className={styles.main} style={{ color: 'black' }}>
        <h1>Contact Us</h1>
        <div className={styles.content}>
          <form className={styles.form}>
            <input type="text" placeholder="Name" required />
            <br/>
            <input type="email" placeholder="Email" required />
            <br/>
            <textarea placeholder="Message" required></textarea>
            <br/>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
