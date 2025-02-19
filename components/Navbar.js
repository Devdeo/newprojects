
import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/Navbar.module.css';
import LoginForm from './LoginForm';

const Navbar = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Image src="/replit.svg" alt="Logo" width={32} height={32} />
          <span className={styles.siteName}>My Site</span>
        </div>
        <button className={styles.joinButton} onClick={() => setShowLogin(true)}>
          Join Now
        </button>
      </nav>
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
