
import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, googleProvider, db } from '../firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import styles from '../styles/LoginForm.module.css';

const LoginForm = ({ onClose }) => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({ 
    email: '', 
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const saveUserData = async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: additionalData.name || user.displayName || '',
          authProvider: additionalData.authProvider || 'email',
          creditBalance: 0,
          createdAt: new Date().toISOString(),
          ...additionalData
        });
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await auth.sendPasswordResetEmail(credentials.email);
      setError('Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin && credentials.password !== credentials.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (isLogin) {
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        await saveUserData(user, { name: credentials.name });
      }
      onClose();
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserData(result.user, { authProvider: 'google' });
      onClose();
      router.push('/dashboard');
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
          {!isLogin && !isForgotPassword && (
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
          {!isForgotPassword && (
            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
          )}
          {!isLogin && !isForgotPassword && (
            <div className={styles.formGroup}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({...credentials, confirmPassword: e.target.value})}
                required
              />
            </div>
          )}
          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Loading...' : (isForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Sign Up'))}
          </button>
        </form>
        {isLogin && !isForgotPassword && (
          <button 
            onClick={() => setIsForgotPassword(true)} 
            className={styles.forgotPasswordBtn}
          >
            Forgot Password?
          </button>
        )}
        {isForgotPassword && (
          <button 
            onClick={() => setIsForgotPassword(false)} 
            className={styles.forgotPasswordBtn}
          >
            Back to Login
          </button>
        )}
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
