import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/Navbar.module.css';
import LoginForm from './LoginForm';

const Navbar = () => {
  const [showLogin, setShowLogin] = useState(false);
  const handleLogout = () => {
    // Add your logout logic here.  For example:
    // localStorage.removeItem('userToken');
    // router.push('/');
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Image src="/replit.svg" alt="Logo" width={32} height={32} />
          <span className={styles.siteName}>My Site</span>
        </div>
        {window.location.pathname === '/dashboard' ? (
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