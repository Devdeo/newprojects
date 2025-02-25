import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/Navbar.module.css';
import LoginForm from './LoginForm';
import {auth, signout} from '../firebase/config';



const Navbar = () => {
  const [showLogin, setShowLogin] = useState(false);
  const handleLogout = () => {
    signout();
    // router.push('/');
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Image src="/replit.svg" alt="Logo" width={32} height={32} />
          <span className={styles.siteName}>My Site</span>
        </div>
        {typeof window !== 'undefined' && window.location.pathname === '/dashboard' ? (
          <button className={styles.joinButton} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className={styles.joinButton} onClick={() => setShowLogin(true)}>
            Join Now
          </button>
        )}
      </nav>
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;