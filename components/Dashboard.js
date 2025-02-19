import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router'; // Assuming Next.js for routing
// Placeholder for Firebase Authentication
const auth = { currentUser: { uid: 'testUser' } }; // Replace with actual Firebase auth

// Placeholder for subscription check function
const checkSubscription = async (uid) => {
  // Replace with actual Firebase Firestore logic to fetch subscription status
  // This example simulates a subscription
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return { isActive: true, planName: 'Premium' };
};


const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active-tasks');
  const [subscription, setSubscription] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserSubscription = async () => {
      if (!auth.currentUser) {
        router.push('/');
        return;
      }

      const subStatus = await checkSubscription(auth.currentUser.uid);
      setSubscription(subStatus);

      if (!subStatus.isActive) {
        router.push('/#pricing');
      }
    };

    checkUserSubscription();
  }, []);

  if (!subscription || !subscription.isActive) {
    return <div>Loading...</div>;
  }

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Previous Task 1', description: 'This is a completed task', status: 'completed' },
    { id: 2, title: 'Previous Task 2', description: 'Another completed task', status: 'completed' },
    { id: 3, title: 'Active Task 1', description: 'This is an active task', status: 'active' }
  ]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const handleCreateTask = (e) => {
    e.preventDefault();
    setTasks([...tasks, { ...newTask, id: Date.now(), status: 'active' }]);
    setNewTask({ title: '', description: '' });
  };

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
            <h2>Active Tasks</h2>
            <form onSubmit={handleCreateTask} className={styles.taskForm}>
              <input
                type="text"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              />
              <textarea
                placeholder="Task Description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                required
              />
              <button type="submit">Create Task</button>
            </form>
            <div className={styles.taskList}>
              {tasks
                .filter(task => task.status === 'active')
                .map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
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
                    <p>{task.description}</p>
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