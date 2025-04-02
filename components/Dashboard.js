import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

import { toast, Toaster } from 'react-hot-toast';

import CreateLive from './CreateLive';
import LiveHistory from './LiveHistory';
import WalletHistory from './WalletHistory';
import AccountSettings from './AccountSettings';
import Navbar from './Navbar';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creditBalance, setCreditBalance] = useState(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef(null);
  const [showPaymentSuccessSign, setShowPaymentSuccessSign] = useState(false);

  // Handle click outside the sidebar to close menu in mobile view
  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth <= 768 && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          !event.target.classList.contains(styles.menuToggle)) {
        setMenuVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle tab switching with credit check
  const handleTabChange = (tab) => {
    if (tab === 'create-live' && creditBalance < 1) {
      toast.error('You need to add credits to create a live stream.');
      return;
    }
    setActiveTab(tab);
  };
  
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });


  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        router.push('/');
        return;
      }

      try {
        setIsLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserInfo({
            name: userData.name || auth.currentUser.displayName || 'User',
            email: userData.email || auth.currentUser.email || 'No email',
            lastWalletUpdate: userData.lastWalletUpdate ? new Date(userData.lastWalletUpdate.toDate()).toLocaleString() : 'Not updated'
          });
          
          // Store credit balance and check if 'create-live' tab should be accessible
          const balance = userData.creditBalance || 0;
          setCreditBalance(balance);
          
          // If user has 0 credits and is trying to access create-live, redirect to dashboard
          if (balance <= 0 && activeTab === 'create-live') {
            setActiveTab('dashboard');
            toast.error('You need credits to create a live stream');
            setTimeout(() => {
              router.push('/purchase');
            }, 1500);
          }

          // Fetch wallet history
          const walletsRef = collection(db, 'users', auth.currentUser.uid, 'wallets');
          const walletsSnapshot = await getDocs(query(walletsRef, orderBy('timestamp', 'desc')));
          const transactionsData = walletsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().timestamp?.toDate?.() || new Date()
          }));

          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchUserData();
  }, [activeTab, router]);
  
  // Handle payment success notification in a separate effect
  useEffect(() => {
    if (router.query.payment_success === 'true') {
      toast.success('Payment successful! Your credits have been added.');
      
      // Show success sign and redirect to dashboard
      setShowPaymentSuccessSign(true);
      setTimeout(() => {
        setShowPaymentSuccessSign(false);
        router.replace('/dashboard', undefined, { shallow: true });
      }, 2000);

      // Refresh user data to get updated balance
      const fetchUserData = async () => {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserInfo({
              name: userData.name || auth.currentUser.displayName || 'User',
              email: userData.email || auth.currentUser.email || 'No email',
              lastWalletUpdate: userData.lastWalletUpdate ? new Date(userData.lastWalletUpdate.toDate()).toLocaleString() : 'Not updated'
            });
            setCreditBalance(userData.creditBalance || 0);
            
            // Fetch wallet history
            const walletsRef = collection(db, 'users', auth.currentUser.uid, 'wallets');
            const walletsSnapshot = await getDocs(query(walletsRef, orderBy('timestamp', 'desc')));
            const transactionsData = walletsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().timestamp?.toDate?.() || new Date()
            }));
            
            setTransactions(transactionsData);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };
      
      fetchUserData();
      
      // Remove the query parameter after a short delay to ensure the toast is displayed
      setTimeout(() => {
        router.replace('/dashboard', undefined, { shallow: true });
      }, 1500);
    }
  }, [router.query.payment_success, router]);


 

  useEffect(() => {
    const fetchTasks = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const tasksRef = collection(userRef, 'tasks');
        const querySnapshot = await getDocs(tasksRef);

        const fetchedTasks = [];
        querySnapshot.forEach((doc) => {
          fetchedTasks.push({ id: doc.id, ...doc.data() });
        });

        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className={styles.dashboard}>
      <Navbar />
      <Toaster position="top-right" reverseOrder={false} />
      {showPaymentSuccessSign && (
        <div className={styles.successOverlay}>
          <div className={styles.successSign}>✔</div>
        </div>
      )}
      <button 
        className={styles.menuToggle}
        onClick={() => setMenuVisible(!menuVisible)}
        aria-label="Toggle menu"
      >
        {menuVisible ? '✕' : '☰'}
      </button>
      <div ref={sidebarRef} className={`${styles.sidebar} ${menuVisible ? styles.visible : styles.hidden}`}>
        <button 
          className={activeTab === 'dashboard' ? styles.active : ''} 
          onClick={() => handleTabChange('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </button>
        <button 
          className={activeTab === 'create-live' ? styles.active : ''} 
          onClick={() => handleTabChange('create-live')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Create Live
        </button>
        <button 
          className={activeTab === 'live-history' ? styles.active : ''} 
          onClick={() => handleTabChange('live-history')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
          </svg>
          Live History
        </button>
        <button 
          className={activeTab === 'wallet-history' ? styles.active : ''} 
          onClick={() => handleTabChange('wallet-history')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
            <path d="M6 12h.01M18 12h.01"></path>
          </svg>
          Wallet History
        </button>
        <button 
          className={activeTab === 'account-settings' ? styles.active : ''} 
          onClick={() => handleTabChange('account-settings')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Account Settings
        </button>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div>
            <div className={styles.skeletonStatsBar}>
              {[1, 2].map((_, index) => (
                <div key={index} className={styles.skeletonStatItem}>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonNumber}></div>
                  <div className={styles.skeletonButton}></div>
                </div>
              ))}
            </div>
            <div className={styles.skeletonTasks}>
              {[1, 2, 3].map((_, index) => (
                <div key={index} className={styles.skeletonTaskCard}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonText}></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <h3>User Info</h3>
                <p>{userInfo.name}</p>
                <p className={styles.email}>{userInfo.email}</p>
              </div>
              <div className={styles.statItem}>
                <h3>Credit Balance</h3>
                <p>{creditBalance.toFixed(2)} credits</p>
                <button 
                  className={styles.addCreditButton}
                  onClick={() => router.push('/purchase')}
                >
                  Add Credits
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Dashboard Overview</h2>
            <div className={styles.dashboardSummary}>
              <div className={styles.summaryCard}>
                <h3>Live Streams created</h3>
                <p className={styles.summaryNumber}>{tasks.filter(task => task.status === 'active').length}</p>
              </div>
             
             
            </div>
            
          </div>
        )}

        {activeTab === 'create-live' && (
          <CreateLive 
            creditBalance={creditBalance}
            setCreditBalance={setCreditBalance}
            tasks={tasks}
            setTasks={setTasks}
          />
        )}

        {activeTab === 'live-history' && (
          <LiveHistory tasks={tasks} />
        )}

        {activeTab === 'wallet-history' && (
          <WalletHistory 
            creditBalance={creditBalance}
            transactions={transactions}
          />
        )}

        {activeTab === 'account-settings' && (
          <AccountSettings userInfo={userInfo} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
