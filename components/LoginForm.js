
import { useState } from 'react';
import styles from '../styles/LoginForm.module.css';

const LoginForm = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [credentials, setCredentials] = useState({ 
    email: '', 
    password: '',
    name: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreeToTerms && !isLogin) {
      alert('Please agree to terms and conditions');
      return;
    }
    console.log('Form submitted with:', credentials);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log('Reset password for:', forgotEmail);
  };

  const handleSocialLogin = (platform) => {
    console.log(`Login with ${platform}`);
  };

  if (showForgotPassword) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <button className={styles.closeButton} onClick={() => setShowForgotPassword(false)}>×</button>
          <h2>Reset Password</h2>
          <form onSubmit={handleForgotPassword}>
            <div className={styles.formGroup}>
              <input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton}>
              Reset Password
            </button>
          </form>
          <div className={styles.switchForm}>
            <button onClick={() => setShowForgotPassword(false)} className={styles.switchButton}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
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
          {isLogin ? (
            <div className={styles.forgotPassword}>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowForgotPassword(true);
              }}>Forgot Password?</a>
            </div>
          ) : (
            <div className={styles.termsCheckbox}>
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
              </label>
            </div>
          )}
          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <div className={styles.socialLogin}>
          <p>Or continue with</p>
          <div className={styles.socialButtons}>
            <button onClick={() => handleSocialLogin('Google')} className={styles.googleBtn}>
              Google
            </button>
            <button onClick={() => handleSocialLogin('Facebook')} className={styles.facebookBtn}>
              Facebook
            </button>
          </div>
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
