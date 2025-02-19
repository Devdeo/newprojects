
import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, googleProvider } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import styles from '../styles/LoginForm.module.css';

const LoginForm = ({ onClose }) => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({ 
    email: '', 
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      } else {
        await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      }
      onClose();
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <input
                type="text"
                placeholder="Full Name"
                value={credentials.name}
                onChange={(e) => setCredentials({...credentials, name: e.target.value})}
                required={!isLogin}
              />
            </div>
          )}
          <div className={styles.formGroup}>
            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className={styles.googleSignIn}>
          <button onClick={handleGoogleSignIn} className={styles.googleButton}>
            Sign in with Google
          </button>
        </div>
        <div className={styles.switchForm}>
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className={styles.switchButton}>
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
