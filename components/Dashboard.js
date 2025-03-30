import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';

import { toast } from 'react-hot-toast';

import CreateLive from './CreateLive';
import LiveHistory from './LiveHistory';
import WalletHistory from './WalletHistory';
import AccountSettings from './AccountSettings';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creditBalance, setCreditBalance] = useState(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef(null);

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
    if (tab === 'create-live' && creditBalance <= 0) {
      toast.error('You need credits to create a live stream. Redirecting to purchase page...');
      setTimeout(() => {
        router.push('/purchase');
      }, 1500);
      return;
    }
    
    setActiveTab(tab);
  };
  
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [newTask, setNewTask] = useState({
    title: '',
    hours: '1',
    key: '',
    videoUrl: '',
    scheduleType: 'now',
    startTime: '',
    endTime: '',
    durationType: 'loop',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [previousPage, setPreviousPage] = useState(1);
  const [walletPage, setWalletPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDetails, setFileDetails] = useState({
    duration: null,
    size: null,
    format: null
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Add credit button handler
  const handleAddCredit = () => {
    router.push('/purchase');
  };

  const getVideoFormat = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return extension;
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        resolve(duration);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Calculate maximum loops based on video duration and credits
  const calculateMaxLoops = () => {
    if (!fileDetails.duration || creditBalance <= 0) return 1;
    
    // Parse duration (format: HH:MM:SS or MM:SS)
    const durationParts = fileDetails.duration.split(':');
    let totalHours = 0;
    
    if (durationParts.length === 3) {
      // HH:MM:SS format
      totalHours = parseInt(durationParts[0]) + (parseInt(durationParts[1]) / 60);
    } else if (durationParts.length === 2) {
      // MM:SS format
      totalHours = parseInt(durationParts[0]) / 60;
    }
    
    if (totalHours === 0) return 1; // Prevent division by zero
    
    // Calculate maximum loops based on available credits (1 credit = 1 hour)
    const maxLoops = Math.floor(creditBalance / totalHours);
    
    // Ensure at least 1 loop is available
    return Math.max(1, maxLoops);
  };

  const handleVideoChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      setVideoFile(file);
      setIsFileUploaded(true);

      // Get file details
      const format = getVideoFormat(file.name);
      const size = formatFileSize(file.size);

      // Show processing state
      setIsUploading(true);
      setUploadStatus('processing');
      setUploadProgress(0);

      try {
        // Get video duration
        const durationInSeconds = await getVideoDuration(file);
        const formattedDuration = formatDuration(durationInSeconds);

        setFileDetails({
          duration: formattedDuration,
          size: size,
          format: format
        });
        
        // Calculate initial loops based on video duration and available credits
        const maxLoops = calculateMaxLoops();
        setNewTask(prev => ({...prev, hours: maxLoops.toString()}));

        // Start the actual file upload
        const email = auth.currentUser.email;
        const formData = new FormData();
        formData.append('video', file);

        // Create XMLHttpRequest for upload with progress tracking
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            setUploadStatus('uploading');
          }
        };

        // Handle upload completion
        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            setUploadStatus('ready');
            setIsUploading(false);
            toast.success('Video uploaded successfully!');
          } else {
            throw new Error('Upload failed');
          }
        };

        // Handle upload errors
        xhr.onerror = () => {
          throw new Error('Upload failed');
        };

        // Start the upload
        xhr.open('POST', `http://localhost:5000/upload/${email}`);
        xhr.send(formData);

      } catch (error) {
        console.error('Error processing video:', error);
        toast.error('Error processing video file. Please try again.');
        setIsUploading(false);
        setUploadStatus('error');
        setUploadProgress(0);
      }
    } else {
      setIsFileUploaded(false);
      setVideoFile(null);
      setFileDetails({
        duration: null,
        size: null,
        format: null
      });
    }
  };

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


  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Calculate credit cost based on video duration and loops
      const durationParts = fileDetails.duration.split(':');
      let totalHours = 0;
      
      if (durationParts.length === 3) {
        // HH:MM:SS format
        totalHours = parseInt(durationParts[0]) + (parseInt(durationParts[1]) / 60);
      } else if (durationParts.length === 2) {
        // MM:SS format
        totalHours = parseInt(durationParts[0]) / 60;
      }
      
      // Calculate total duration in hours (including loops)
      const loops = parseInt(newTask.hours) || 1;
      const totalHoursNeeded = totalHours * loops;
      
      // Verify user has enough credits
      if (userData.creditBalance < totalHoursNeeded) {
        throw new Error(`Insufficient credits. This stream requires ${totalHoursNeeded.toFixed(2)} credits, but you only have ${userData.creditBalance.toFixed(2)} credits.`);
      }
      
      const tasksRef = collection(userRef, 'tasks');

      // Upload video file first
      const email = auth.currentUser.email;
      const formData = new FormData();
      formData.append('video', videoFile);
      
      // Upload video to local server
      const uploadResponse = await fetch(`http://localhost:5000/upload/${email}`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }
      
      const { videoId } = await uploadResponse.json();

      // Create task data with video ID
      const taskData = {
        title: newTask.title,
        hours: parseInt(newTask.hours) || 1,
        durationType: newTask.durationType || 'loop',
        streamKey: newTask.key,
        status: 'active',
        createdAt: serverTimestamp(),
        createdDate: new Date().toISOString(),
        videoUrl: '',
        videoId: videoId,
        creditCost: totalHoursNeeded
      };

      const taskDoc = await addDoc(tasksRef, taskData);

      // Start the stream with the obtained video ID
      const startResponse = await fetch(`http://localhost:5000/start/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamKey: newTask.key,
          loops: parseInt(newTask.hours) || 1,
          durationType: newTask.durationType,
          taskId: taskDoc.id
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start stream');
      }

      // Deduct credits from user's balance
      const newBalance = userData.creditBalance - totalHoursNeeded;
      await updateDoc(userRef, {
        creditBalance: newBalance,
        lastWalletUpdate: new Date()
      });
      
      // Add transaction record for the credit deduction
      const transactionId = `stream_${Date.now()}`;
      const transactionsRef = doc(db, 'users', auth.currentUser.uid, 'wallets', transactionId);
      await setDoc(transactionsRef, {
        amount: -totalHoursNeeded,
        type: 'debit',
        description: `Stream: ${newTask.title}`,
        timestamp: new Date(),
        balance: newBalance,
        taskId: taskDoc.id
      });

      // Update local state to reflect new balance
      setCreditBalance(newBalance);

      // Update state and remaining code...
      const newTaskData = {
        id: taskDoc.id,
        title: newTask.title,
        hours: parseInt(newTask.hours) || 1,
        streamKey: newTask.key,
        status: 'active',
        createdAt: new Date(),
        createdDate: new Date().toISOString(),
        videoId: videoId,
        creditCost: totalHoursNeeded
      };

      setTasks([...tasks, newTaskData]);
      setNewTask({ 
        title: '', 
        hours: '', 
        key: '', 
        videoUrl: '',
        scheduleType: 'now',
        startTime: '',
        endTime: '',
        durationType: 'loop'
      });
      setVideoFile(null);
      setIsFileUploaded(false);
      setIsUploading(false);
      setUploadStatus('success');
      setUploadProgress(100);

      // Show success message with credit info
      toast.success(`Stream started successfully! ${totalHoursNeeded.toFixed(2)} credits used.`);

    } catch (error) {
      console.error('Error creating task:', error);
      setUploadStatus('error');
      setUploadProgress(0);
      toast.error(error.message || 'Failed to start stream. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUploadStatus('');
        setUploadProgress(0);
      }, 3000);
    }
  };

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
          <>
            <div className={styles.skeletonStatsBar}>
              <div className={styles.skeletonStatItem}>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonNumber}></div>
                <div className={styles.skeletonButton}></div>
              </div>
            </div>
            <div className={styles.skeletonTasks}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonTaskCard}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonText}></div>
                  <div className={styles.skeletonText}></div>
                </div>
              ))}
            </div>
          </>
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
                <h3>Active Streams</h3>
                <p className={styles.summaryNumber}>{tasks.filter(task => task.status === 'active').length}</p>
              </div>
              <div className={styles.summaryCard}>
                <h3>Scheduled Streams</h3>
                <p className={styles.summaryNumber}>{tasks.filter(task => task.status === 'scheduled').length}</p>
              </div>
              <div className={styles.summaryCard}>
                <h3>Previous Streams</h3>
                <p className={styles.summaryNumber}>{tasks.filter(task => task.status === 'completed').length}</p>
              </div>
            </div>
            <div className={styles.recentActivity}>
              <h3>Recent Activity</h3>
              <p>No recent activity to display.</p>
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
