
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';
import LoginForm from './LoginForm';
import signOutUser from '../firebase/config';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
          <Logo />
        </div>
        {user ? (
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
