import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/404.module.css';

const NotFound = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Page Not Found</title>
        <meta name="description" content="404 Page" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.description}>
          The page you are looking for doesn't exist.
        </p>
        <Link className={styles.back} href="/">
          Back to Homepage
        </Link>
      </main>
    </div>
  );
};

export default NotFound;