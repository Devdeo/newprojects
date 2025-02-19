
import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active-tasks');
  const [subscription, setSubscription] = useState(null);
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    hours: '',
    key: '',
    videoUrl: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserSubscription = async () => {
      if (!auth.currentUser) {
        router.push('/');
        return;
      }
      // Subscription check logic here
      setSubscription({ isActive: true });
    };

    checkUserSubscription();
  }, []);

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let videoUrl = '';
      if (videoFile) {
        const storage = getStorage();
        const videoRef = ref(storage, `videos/${Date.now()}-${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }

      const taskData = {
        ...newTask,
        videoUrl,
        status: 'active',
        createdAt: new Date(),
        userId: auth.currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      setTasks([...tasks, { id: docRef.id, ...taskData }]);
      setNewTask({ title: '', hours: '', key: '', videoUrl: '' });
      setVideoFile(null);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription || !subscription.isActive) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
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
          className={activeTab === 'billing' ? styles.active : ''} 
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </button>
        <button 
          className={activeTab === 'settings' ? styles.active : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Account Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'active-tasks' && (
          <div>
            <h2>Create New Task</h2>
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
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div>
            <h2>Billing Information</h2>
            <p>Your billing information and subscription details will appear here.</p>
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
