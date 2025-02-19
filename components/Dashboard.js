
import { useState } from 'react';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
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
          className={activeTab === 'tasks' ? styles.active : ''} 
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
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
        {activeTab === 'tasks' && (
          <div>
            <h2>Tasks</h2>
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
              {tasks.map(task => (
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
