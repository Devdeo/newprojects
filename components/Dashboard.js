import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creditBalance, setCreditBalance] = useState(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [newTask, setNewTask] = useState({
    title: '',
    hours: '',
    key: '',
    videoUrl: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
            email: userData.email || auth.currentUser.email || 'No email'
          });
          setCreditBalance(userData.creditBalance || 0);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchUserData();
  }, []);

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const tasksRef = collection(userRef, 'tasks');
      
      const taskDoc = await addDoc(tasksRef, {
        title: newTask.title,
        hours: parseInt(newTask.hours),
        streamKey: newTask.key,
        status: 'active',
        createdAt: serverTimestamp(),
        videoUrl: ''
      });

      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('taskId', taskDoc.id);
        formData.append('username', userInfo.name)

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
        hours: parseInt(newTask.hours),
        streamKey: newTask.key,
        status: 'active',
        createdAt: new Date()
      };

      setTasks([...tasks, newTaskData]);
      setNewTask({ title: '', hours: '', key: '', videoUrl: '' });
      setVideoFile(null);
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
        const querySnapshot = await getDoc(tasksRef);
        
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
      >
        ☰
      </button>
      <div className={`${styles.sidebar} ${menuVisible ? styles.visible : styles.hidden}`}>
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
                <button 
                  className={styles.addCreditButton}
                  onClick={() => router.push('/pricing#credit')}
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
                <p className={styles.summaryNumber}>0</p>
              </div>
              <div className={styles.summaryCard}>
                <h3>Scheduled Streams</h3>
                <p className={styles.summaryNumber}>0</p>
              </div>
              <div className={styles.summaryCard}>
                <h3>Credit Balance</h3>
                <p className={styles.summaryNumber}>{creditBalance}</p>
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
              <input
                type="number"
                placeholder="Hours Required"
                value={newTask.hours}
                onChange={(e) => setNewTask({...newTask, hours: e.target.value})}
                required
                min="1"
              />
              <input
                type="text"
                placeholder="Stream Key"
                value={newTask.key}
                onChange={(e) => setNewTask({...newTask, key: e.target.value})}
                required
              />
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Live Stream'}
              </button>
              {uploadStatus && (
                <div className={styles.uploadStatus}>
                  {uploadStatus === 'uploading' && (
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className={styles.successMessage}>
                      Stream started successfully!
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className={styles.errorMessage}>
                      Failed to start stream. Please try again.
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'active-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Active Live Streams</h2>
            <div className={styles.taskList}>
              {tasks
                .filter(task => task.status === 'active')
                .map(task => (
                  <div key={task.id} className={styles.taskCard}>
                    <h3>{task.title}</h3>
                    <p>Hours: {task.hours}</p>
                    <p>Key: {task.key}</p>
                    {task.videoUrl && (
                      <video width="100%" controls>
                        <source src={task.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    <span className={styles.status}>{task.status}</span>
                    <p className={styles.timestamp}>Started: {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Just now'}</p>
                    <button className={styles.stopButton}>Stop Stream</button>
                  </div>
                ))}
              {!tasks.filter(task => task.status === 'active').length && (
                <p>No active streams found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Schedule Live Stream</h2>
            <form className={styles.taskForm}>
              <input
                type="text"
                placeholder="Stream Title"
                required
              />
              <input
                type="number"
                placeholder="Hours Required"
                required
                min="1"
              />
              <input
                type="text"
                placeholder="Stream Key"
                required
              />
              <input
                type="file"
                accept="video/*"
                required
              />
              <div className={styles.scheduleFields}>
                <label>Start Date and Time</label>
                <input type="datetime-local" required />
              </div>
              <button type="submit">
                Schedule Stream
              </button>
            </form>
            <div className={styles.scheduledList}>
              <h3>Scheduled Streams</h3>
              <p>No scheduled streams found.</p>
            </div>
          </div>
        )}

        {activeTab === 'previous-live' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Previous Live Streams</h2>
            <div className={styles.taskList}>
              {tasks
                .filter(task => task.status === 'completed')
                .map(task => (
                  <div key={task.id} className={styles.taskCard}>
                    <h3>{task.title}</h3>
                    <p>Duration: {task.hours} hours</p>
                    <p>Key: {task.key}</p>
                    {task.videoUrl && (
                      <video width="100%" controls>
                        <source src={task.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    <span className={styles.status}>{task.status}</span>
                    <p className={styles.timestamp}>Streamed on: {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Recently'}</p>
                    <button className={styles.restartButton}>Restart Stream</button>
                  </div>
                ))}
              {!tasks.filter(task => task.status === 'completed').length && (
                <p>No previous streams found.</p>
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
                  onClick={() => router.push('/pricing#credit')}
                >
                  Add Credits
                </button>
              </div>
            </div>
            <div className={styles.transactionHistory}>
              <h3>Transaction History</h3>
              <div className={styles.transactionList}>
                <p>No transaction history found.</p>
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