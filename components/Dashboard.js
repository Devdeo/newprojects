import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active-tasks');
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

        const response = await fetch('/api/upload', {
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
      >
        ☰
      </button>
      <div className={`${styles.sidebar} ${menuVisible ? styles.visible : styles.hidden}`}>
        <button 
          className={activeTab === 'active-tasks' ? styles.active : ''} 
          onClick={() => setActiveTab('active-tasks')}
        >
          Active Tasks
        </button>
        <button 
          className={activeTab === 'previous-tasks' ? styles.active : ''} 
          onClick={() => setActiveTab('previous-tasks')}
        >
          Previous Tasks
        </button>
        <button 
          className={activeTab === 'settings' ? styles.active : ''} 
          onClick={() => setActiveTab('settings')}
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
        {activeTab === 'active-tasks' && (
          <div>
            <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask} className={styles.taskForm}>
              <input
                type="text"
                placeholder="Task Title"
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
                placeholder="Key"
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
                {loading ? 'Creating...' : 'Create Task'}
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

            <div className={styles.taskList}>
              {tasks.map(task => (
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
                  <p className={styles.timestamp}>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Just now'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'previous-tasks' && (
          <div>
            <h2>Previous Tasks</h2>
            <div className={styles.taskList}>
              {tasks
                .filter(task => task.status === 'completed')
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
                    <p className={styles.timestamp}>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Just now'}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2>Account Settings</h2>
            <p>Manage your account settings and preferences here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;