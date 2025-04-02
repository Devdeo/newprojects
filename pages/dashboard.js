
import {useState, useEffect} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';
import { auth } from '../firebase/config';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import styles from '../styles/Page.module.css';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleResendVerification = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        setResendDisabled(true);
        setCountdown(60);
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to send verification email. Please try again later.");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
        return;
      }
      
      setUser(currentUser);
      
      // Check if email verification is required (doesn't apply to OAuth providers)
      const isEmailProvider = currentUser.providerData[0]?.providerId === 'password';
      const needsVerification = isEmailProvider && !currentUser.emailVerified;
      
      setEmailVerified(!needsVerification);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Head>
        <title>Dashboard - Loop Live on youtube</title>
        <meta name="Loop Live" content="User dashboard" />
      </Head>
      <Navbar />
      
      {!emailVerified ? (
        <div className={styles.container}>
          <main className={styles.main}>
            <div className={styles.verificationContainer}>
              <h1>Email Verification Required</h1>
              <p>Please verify your email address to access the dashboard.</p>
              <p>A verification link has been sent to: <strong>{user?.email}</strong></p>
              <p>Please check your inbox and click the link to verify your email.</p>
              
              <button 
                className={styles.resendButton}
                onClick={handleResendVerification}
                disabled={resendDisabled}
              >
                {resendDisabled 
                  ? `Resend email in ${countdown}s` 
                  : 'Resend verification email'}
              </button>
              
              <p className={styles.refreshNote}>
                Already verified? Try <a href="/dashboard" className={styles.refreshLink}>refreshing the page</a>.
              </p>
            </div>
          </main>
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
};

export default DashboardPage;
