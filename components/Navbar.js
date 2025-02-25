import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';
import LoginForm from './LoginForm';
import signOutUser from '../firebase/config';
import { auth } from '../firebase/config';



const Navbar = () => {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
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