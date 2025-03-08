import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { toast } from 'react-hot-toast';

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
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [newTask, setNewTask] = useState({
    title: '',
    hours: '',
    key: '',
    videoUrl: '',
    scheduleType: 'now',
    startTime: '',
    endTime: '',
    durationType: 'hours',
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

  const handleVideoChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setIsFileUploaded(true);

      // Get file details
      const format = getVideoFormat(file.name);
      const size = formatFileSize(file.size);

      // Simulate file processing/validation
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
      } catch (error) {
        console.error('Error getting video details:', error);
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadStatus('ready');
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
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
          setCreditBalance(userData.creditBalance || 0);

          // Fetch transaction history
          const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
          const transactionsSnapshot = await getDocs(transactionsRef);
          const transactionsData = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().timestamp?.toDate?.() || new Date()
          })).sort((a, b) => b.date - a.date);

          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchUserData();

    // Check for payment success query parameter
    if (router.query.payment === 'success') {
      toast.success('Payment successful! Your credits have been added.');
      // Remove the query parameter
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router]);


  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const tasksRef = collection(userRef, 'tasks');

      const taskData = {
        title: newTask.title,
        hours: parseInt(newTask.hours) || 1,
        durationType: newTask.durationType || 'hours',
        streamKey: newTask.key,
        status: newTask.scheduleType === 'schedule' ? 'scheduled' : 'active',
        createdAt: serverTimestamp(),
        videoUrl: ''
      };

      // Add scheduling data if provided
      if (newTask.scheduleType === 'schedule') {
        taskData.scheduledStartTime = new Date(newTask.startTime).toISOString();
        taskData.scheduledEndTime = new Date(newTask.endTime).toISOString();
      } else if (newTask.endTime) {
        taskData.scheduledEndTime = new Date(newTask.endTime).toISOString();
      }

      const taskDoc = await addDoc(tasksRef, taskData);

      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('taskId', taskDoc.id);
        formData.append('username', userInfo.name);
        formData.append('streamKey', newTask.key);
        formData.append('title', newTask.title);
        formData.append('hours', newTask.hours);

        if (newTask.scheduleType === 'schedule') {
          formData.append('scheduleType', 'schedule');
          formData.append('startTime', newTask.startTime);
          formData.append('endTime', newTask.endTime);
        } else if (newTask.endTime) {
          formData.append('scheduleType', 'now-with-end');
          formData.append('endTime', newTask.endTime);
        }

        const response = await fetch('https://eb4bf809-0913-457d-9e00-c8d2f4958056-00-3s9tya49ey7lx.pike.repl.co/upload-video', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload video');
        }
      }

      const newTaskData = {
        id: taskDoc.id,
        title: newTask.title,
        hours: parseInt(newTask.hours) || 1,
        streamKey: newTask.key,
        status: newTask.scheduleType === 'schedule' ? 'scheduled' : 'active',
        createdAt: new Date()
      };

      if (newTask.scheduleType === 'schedule') {
        newTaskData.scheduledStartTime = new Date(newTask.startTime);
        newTaskData.scheduledEndTime = new Date(newTask.endTime);
      } else if (newTask.endTime) {
        newTaskData.scheduledEndTime = new Date(newTask.endTime);
      }

      setTasks([...tasks, newTaskData]);
      setNewTask({ 
        title: '', 
        hours: '', 
        key: '', 
        videoUrl: '',
        scheduleType: 'now',
        startTime: '',
        endTime: '',
        durationType: 'hours'
      });
      setVideoFile(null);
      setIsFileUploaded(false);
      setIsUploading(false);
      setUploadStatus('success');
      setUploadProgress(100);

    } catch (error) {
      console.error('Error creating task:', error);
      setUploadStatus('error');
      setUploadProgress(0);
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
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'create-live' ? styles.active : ''} 
          onClick={() => setActiveTab('create-live')}
        >
          Create Live
        </button>
        <button 
          className={activeTab === 'active-live' ? styles.active : ''} 
          onClick={() => setActiveTab('active-live')}
        >
          Active Live
        </button>
        <button 
          className={activeTab === 'schedule-live' ? styles.active : ''} 
          onClick={() => setActiveTab('schedule-live')}
        >
          Schedule Live
        </button>
        <button 
          className={activeTab === 'previous-live' ? styles.active : ''} 
          onClick={() => setActiveTab('previous-live')}
        >
          Previous Live
        </button>
        <button 
          className={activeTab === 'wallet-history' ? styles.active : ''} 
          onClick={() => setActiveTab('wallet-history')}
        >
          Wallet History
        </button>
        <button 
          className={activeTab === 'account-settings' ? styles.active : ''} 
          onClick={() => setActiveTab('account-settings')}
        >
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
                <p>{creditBalance} credits</p>
                {userInfo.lastWalletUpdate && (
                  <p className={styles.lastUpdate}>Last updated: {userInfo.lastWalletUpdate}</p>
                )}
                <button 
                  className={styles.addCreditButton}
                  onClick={() => router.push('/purchase?quantity=10')}
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
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Create New Live Stream</h2>
            <form onSubmit={handleCreateTask} className={styles.taskForm}>
              <input
                type="text"
                placeholder="Stream Title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />



              <div className={styles.formGroup}>
                <label>Upload Video File</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  required
                />
                {isFileUploaded && (
                  <div className={styles.fileDetails}>
                    <h4>Video File Details</h4>
                    <ul>
                      <li><strong>File Name:</strong> {videoFile.name}</li>
                      <li><strong>Size:</strong> {fileDetails.size || 'Calculating...'}</li>
                      <li><strong>Duration:</strong> {fileDetails.duration || 'Calculating...'}</li>
                      <li><strong>Format:</strong> {fileDetails.format || 'Detecting...'}</li>
                    </ul>
                  </div>
                )}

                {isUploading && (
                  <div className={styles.fileUploadStatus}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                    <p className={styles.uploadingMessage}>
                      {uploadStatus === 'processing' ? 'Processing video file...' : 'Uploading video...'} {uploadProgress}% complete
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelWithInfo}>
                  <label>Stream Key</label>
                  <button 
                    type="button"
                    className={styles.infoButton}
                    onClick={() => {
                      alert('Stream Key Information:\n\n• A stream key is a unique identifier that connects your broadcast software to your streaming platform.\n\n• You can find your stream key in your YouTube Studio dashboard under "Stream" settings.\n\n• Never share your stream key publicly as it gives access to stream on your channel.\n\n• If you believe your key is compromised, you can reset it in your streaming platform settings.');
                    }}
                  >
                    <span>i</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={isFileUploaded ? "YouTube Stream Key" : "Upload a video file first"}
                  value={newTask.key}
                  onChange={(e) => setNewTask({...newTask, key: e.target.value})}
                  disabled={!isFileUploaded || isUploading}
                  required
                  className={(!isFileUploaded || isUploading) ? styles.disabledInput : ''}
                />
                <button 
                  type="button" 
                  className={styles.verifyButton}
                  disabled={!isFileUploaded || !newTask.key || isUploading}
                  onClick={() => {
                    if (!newTask.key) {
                      alert('Please enter a stream key first');
                      return;
                    }

                    // In a real application, you would verify with YouTube API
                    // For now, we'll just do a basic validation
                    if (newTask.key.length < 8) {
                      alert('Stream key is too short. Please enter a valid key.');
                    } else {
                      alert('Stream key format verified! In a production environment, this would validate with YouTube.');
                    }
                  }}
                >
                  Verify Key
                </button>
              </div>

              <div className={styles.streamOptions}>
                <h3>Streaming Options</h3>

                <div className={styles.selectOptionContainer}>
                  <select
                    className={styles.streamTypeSelect}
                    value={newTask.scheduleType}
                    onChange={(e) => setNewTask({...newTask, scheduleType: e.target.value})}
                  >
                    <option value="now">Live Now</option>
                    <option value="schedule">Schedule Live</option>
                  </select>
                </div>

                {(!newTask.scheduleType || newTask.scheduleType === 'now') && (
                  <div className={styles.nowOptions}>
                    <div className={styles.formGroup}>
                      <label>Stream Duration</label>
                      <div className={styles.durationTypeContainer}>
                        <select 
                          className={styles.durationTypeSelect}
                          value={newTask.durationType || 'hours'}
                          onChange={(e) => setNewTask({...newTask, durationType: e.target.value})}
                        >
                          <option value="hours">Hours</option>
                          <option value="loop">Loop</option>
                        </select>
                        {newTask.durationType === 'loop' ? (
                          <div className={styles.numberInputGroup}>
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue > 1) {
                                  setNewTask({...newTask, hours: (currentValue - 1).toString()});
                                }
                              }}
                              disabled={parseInt(newTask.hours) <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              placeholder="Number of Loops"
                              value={newTask.hours}
                              onChange={(e) => {
                                const maxLoops = Math.floor(creditBalance);
                                const inputValue = parseInt(e.target.value);
                                if (!isNaN(inputValue) && inputValue > maxLoops) {
                                  alert(`You can only loop up to ${maxLoops} times with your current credit balance.`);
                                  setNewTask({...newTask, hours: maxLoops.toString()});
                                } else {
                                  setNewTask({...newTask, hours: e.target.value});
                                }
                              }}
                              required
                              min="1"
                              max={Math.floor(creditBalance)}
                            />
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const maxLoops = Math.floor(creditBalance);
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue < maxLoops) {
                                  setNewTask({...newTask, hours: (currentValue + 1).toString()});
                                } else {
                                  alert(`You can only loop up to ${maxLoops} times with your current credit balance.`);
                                }
                              }}
                              disabled={parseInt(newTask.hours) >= Math.floor(creditBalance)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className={styles.numberInputGroup}>
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue > 1) {
                                  setNewTask({...newTask, hours: (currentValue - 1).toString()});
                                }
                              }}
                              disabled={parseInt(newTask.hours) <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              placeholder="Hours"
                              value={newTask.hours}
                              onChange={(e) => {
                                const maxHours = Math.floor(creditBalance);
                                const inputValue = parseInt(e.target.value);
                                if (!isNaN(inputValue) && inputValue > maxHours) {
                                  alert(`You can only stream up to ${maxHours} hours with your current credit balance.`);
                                  setNewTask({...newTask, hours: maxHours.toString()});
                                } else {
                                  setNewTask({...newTask, hours: e.target.value});
                                }
                              }}
                              required
                              min="1"
                              max={Math.floor(creditBalance)}
                            />
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const maxHours = Math.floor(creditBalance);
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue < maxHours) {
                                  setNewTask({...newTask, hours: (currentValue + 1).toString()});
                                } else {
                                  alert(`You can only stream up to ${maxHours} hours with your current credit balance.`);
                                }
                              }}
                              disabled={parseInt(newTask.hours) >= Math.floor(creditBalance)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <small className={styles.creditInfo}>
                        {newTask.durationType === 'loop' 
                          ? `Each loop costs 1 credit. Maximum: ${Math.floor(creditBalance)} loops.` 
                          : `Each hour costs 1 credit. Maximum: ${Math.floor(creditBalance)} hours.`}
                      </small>
                    </div>
                  </div>
                )}

                {newTask.scheduleType === 'schedule' && (
                  <div className={styles.scheduleOptions}>
                    <div className={styles.formGroup}>
                      <label>Start Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Stream Duration</label>
                      <div className={styles.durationTypeContainer}>
                        <select 
                          className={styles.durationTypeSelect}
                          value={newTask.durationType || 'hours'}
                          onChange={(e) => setNewTask({...newTask, durationType: e.target.value})}
                        >
                          <option value="hours">Hours</option>
                          <option value="loop">Loop</option>
                        </select>
                        {newTask.durationType === 'loop' ? (
                          <div className={styles.numberInputGroup}>
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue > 1) {
                                  setNewTask({...newTask, hours: (currentValue - 1).toString()});
                                }
                              }}
                              disabled={parseInt(newTask.hours) <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              placeholder="Number of Loops"
                              value={newTask.hours}
                              onChange={(e) => {
                                const maxLoops = Math.floor(creditBalance);
                                const inputValue = parseInt(e.target.value);
                                if (!isNaN(inputValue) && inputValue > maxLoops) {
                                  alert(`You can only loop up to ${maxLoops} times with your current credit balance.`);
                                  setNewTask({...newTask, hours: maxLoops.toString()});
                                } else {
                                  setNewTask({...newTask, hours: e.target.value});
                                }
                              }}
                              required
                              min="1"
                              max={Math.floor(creditBalance)}
                            />
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const maxLoops = Math.floor(creditBalance);
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue < maxLoops) {
                                  setNewTask({...newTask, hours: (currentValue + 1).toString()});
                                } else {
                                  alert(`You can only loop up to ${maxLoops} times with your current credit balance.`);
                                }
                              }}
                              disabled={parseInt(newTask.hours) >= Math.floor(creditBalance)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className={styles.numberInputGroup}>
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue > 1) {
                                  setNewTask({...newTask, hours: (currentValue - 1).toString()});
                                }
                              }}
                              disabled={parseInt(newTask.hours) <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              placeholder="Hours"
                              value={newTask.hours}
                              onChange={(e) => {
                                const maxHours = Math.floor(creditBalance);
                                const inputValue = parseInt(e.target.value);
                                if (!isNaN(inputValue) && inputValue > maxHours) {
                                  alert(`You can only stream up to ${maxHours} hours with your current credit balance.`);
                                  setNewTask({...newTask, hours: maxHours.toString()});
                                } else {
                                  setNewTask({...newTask, hours: e.target.value});
                                }
                              }}
                              required
                              min="1"
                              max={Math.floor(creditBalance)}
                            />
                            <button 
                              type="button"
                              className={styles.numberInputButton}
                              onClick={() => {
                                const maxHours = Math.floor(creditBalance);
                                const currentValue = parseInt(newTask.hours) || 0;
                                if (currentValue < maxHours) {
                                  setNewTask({...newTask, hours: (currentValue + 1).toString()});
                                } else {
                                  alert(`You can only stream up to ${maxHours} hours with your current credit balance.`);
                                }
                              }}
                              disabled={parseInt(newTask.hours) >= Math.floor(creditBalance)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <small className={styles.creditInfo}>
                        {newTask.durationType === 'loop' 
                          ? `Each loop costs 1 credit. Maximum: ${Math.floor(creditBalance)} loops.` 
                          : `Each hour costs 1 credit. Maximum: ${Math.floor(creditBalance)} hours.`}
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading || !isFileUploaded || isUploading} 
                className={styles.submitButton}
              >
                {loading ? 'Processing...' : newTask.scheduleType === 'schedule' ? 'Schedule Stream' : 'Start Live Stream'}
              </button>

              {uploadStatus && (
                <div className={styles.uploadStatus}>
                  {uploadStatus === 'uploading' && (
                    <>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{width: `${uploadProgress}%`}}
                        ></div>
                      </div>
                      <p className={styles.uploadingMessage}>
                        Uploading video... {uploadProgress}% complete. 
                        {videoFile && <span>File: {videoFile.name}</span>}
                      </p>
                    </>
                  )}
                  {uploadStatus === 'success' && (
                    <div className={styles.successMessage}>
                      {newTask.scheduleType === 'schedule' 
                        ? `Stream scheduled successfully! Using key: ${newTask.key}` 
                        : `Stream started successfully! Using key: ${newTask.key}`}
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className={styles.errorMessage}>
                      Failed to {newTask.scheduleType === 'schedule' ? 'schedule' : 'start'} stream. Please try again.
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}{activeTab === 'active-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Active Live Streams</h2>
            <div className={styles.tableContainer}>
              <table className={`${styles.dataTable} ${styles.borderedTable}`}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Hours</th>
                    <th>Stream Key</th>
                    <th>Status</th>
                    <th>Start Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter(task => task.status === 'active')
                    .slice((activePage - 1) * 10, activePage * 10)
                    .map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.hours} hours</td>
                        <td>{task.streamKey}</td>
                        <td><span className={styles.statusBadge}>{task.status}</span></td>
                        <td>{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Just now'}</td>
                      </tr>
                    ))}
                  {!tasks.filter(task => task.status === 'active').length && (
                    <tr>
                      <td colSpan="5" className={styles.emptyMessage}>No active streams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {tasks.filter(task => task.status === 'active').length > 0 && (
                <div className={styles.pagination}>
                  <button 
                    className={styles.paginationButton} 
                    disabled={activePage === 1}
                    onClick={() => setActivePage(activePage - 1)}
                  >
                    Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {activePage} of {Math.ceil(tasks.filter(task => task.status === 'active').length / 10)}
                  </span>
                  <button 
                    className={styles.paginationButton} 
                    disabled={activePage === Math.ceil(tasks.filter(task => task.status === 'active').length / 10)}
                    onClick={() => setActivePage(activePage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Schedule Live Stream</h2>
            <div className={styles.tableContainer}>
              <table className={`${styles.dataTable} ${styles.borderedTable}`}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Hours</th>
                    <th>Stream Key</th>
                    <th>Scheduled Start</th>
                    <th>Scheduled End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter(task => task.status === 'scheduled')
                    .slice((schedulePage - 1) * 10, schedulePage * 10)
                    .map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.hours} hours</td>
                        <td>{task.streamKey}</td>
                        <td>{task.scheduledStartTime ? new Date(task.scheduledStartTime).toLocaleString() : 'N/A'}</td>
                        <td>{task.scheduledEndTime ? new Date(task.scheduledEndTime).toLocaleString() : 'N/A'}</td>
                        <td><span className={styles.statusBadge}>{task.status}</span></td>
                        <td>
                          <button className={`${styles.actionButton} ${styles.liveNowButton}`}>Live Now</button>
                          <button className={styles.actionButton}>Edit</button>
                          <button className={styles.actionButton}>Cancel</button>
                        </td>
                      </tr>
                    ))}
                  {!tasks.filter(task => task.status === 'scheduled').length && (
                    <tr>
                      <td colSpan="7" className={styles.emptyMessage}>No scheduled streams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {tasks.filter(task => task.status === 'scheduled').length > 0 && (
                <div className={styles.pagination}>
                  <button 
                    className={styles.paginationButton} 
                    disabled={schedulePage === 1}
                    onClick={() => setSchedulePage(schedulePage - 1)}
                  >
                    Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {schedulePage} of {Math.ceil(tasks.filter(task => task.status === 'scheduled').length / 10)}
                  </span>
                  <button 
                    className={styles.paginationButton} 
                    disabled={schedulePage === Math.ceil(tasks.filter(task => task.status=== 'scheduled').length / 10)}
                    onClick={() => setSchedulePage(schedulePage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'previous-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Previous Live Streams</h2>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Stream Key</th>
                    <th>Status</th>
                    <th>Stream Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter(task => task.status === 'completed')
                    .slice((previousPage - 1) * 10, previousPage * 10)
                    .map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.hours} hours</td>
                        <td>{task.streamKey}</td>
                        <td><span className={styles.statusBadge}>{task.status}</span></td>
                        <td>{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Recently'}</td>
                        <td>
                          <button className={styles.actionButton}>Restart</button>
                          <button className={styles.actionButton}>View</button>
                        </td>
                      </tr>
                    ))}
                  {!tasks.filter(task => task.status === 'completed').length && (
                    <tr>
                      <td colSpan="6" className={styles.emptyMessage}>No previous streams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {tasks.filter(task => task.status === 'completed').length > 0 && (
                <div className={styles.pagination}>
                  <button 
                    className={styles.paginationButton} 
                    disabled={previousPage === 1}
                    onClick={() => setPreviousPage(previousPage - 1)}
                  >
                    Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {previousPage} of {Math.ceil(tasks.filter(task => task.status === 'completed').length / 10)}
                  </span>
                  <button 
                    className={styles.paginationButton} 
                    disabled={previousPage === Math.ceil(tasks.filter(task => task.status === 'completed').length / 10)}
                    onClick={() => setPreviousPage(previousPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet-history' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Wallet History</h2>
            <div className={styles.walletSummary}>
              <div className={styles.walletBalance}>
                <h3>Current Balance</h3>
                <p className={styles.balanceAmount}>{creditBalance} credits</p>
                <button 
                  className={styles.addCreditButton}
                  onClick={() => router.push('/purchase?quantity=10')}
                >
                  Add Credits
                </button>
              </div>
            </div>
            <div className={styles.transactionHistory}>
              <h3>Transaction History</h3>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction ID</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions
                        .slice((walletPage - 1) * 10, walletPage * 10)
                        .map((transaction, index) => (
                          <tr key={transaction.id || index}>
                            <td>{transaction.date ? new Date(transaction.date).toLocaleString() : '-'}</td>
                            <td>{transaction.id || `TRX-${index+1000}`}</td>
                            <td>{transaction.description || 'Credit transaction'}</td>
                            <td>{transaction.amount || '0'} credits</td>
                            <td>
                              <span className={`${styles.statusBadge} ${transaction.type === 'credit' ? styles.statusCredit : styles.statusDebit}`}>
                                {transaction.type || 'credit'}
                              </span>
                            </td>
                            <td>{transaction.balance || creditBalance} credits</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="6" className={styles.emptyMessage}>No transaction history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {transactions.length > 0 && (
                  <div className={styles.pagination}>
                    <button 
                      className={styles.paginationButton} 
                      disabled={walletPage === 1}
                      onClick={() => setWalletPage(walletPage - 1)}
                    >
                      Previous
                    </button>
                    <span className={styles.pageInfo}>
                      Page {walletPage} of {Math.ceil(transactions.length / 10)}
                    </span>
                    <button 
                      className={styles.paginationButton} 
                      disabled={walletPage === Math.ceil(transactions.length / 10)}
                      onClick={() => setWalletPage(walletPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account-settings' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Account Settings</h2>
            <form className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label>Display Name</label>
                <input 
                  type="text" 
                  defaultValue={userInfo.name} 
                  placeholder="Your Name"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  defaultValue={userInfo.email} 
                  disabled
                />
                <small>Email cannot be changed</small>
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <button type="button" className={styles.changePasswordBtn}>
                  Change Password
                </button>
              </div>
              <div className={styles.formGroup}>
                <label>Notification Preferences</label>
                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="emailNotifications" />
                  <label htmlFor="emailNotifications">Email Notifications</label>
                </div>
              </div>
              <button type="submit" className={styles.saveSettingsBtn}>
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;