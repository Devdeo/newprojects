import { useState } from 'react';
import styles from '../styles/Dashboard.module.css';

const LiveHistory = ({ tasks }) => {
  const [activePage, setActivePage] = useState(1);

  return (
    <div>
      <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Live Stream History</h2>
      
      <div className={styles.liveHistoryFilter}>
        <select 
          className={styles.historyFilterSelect}
          onChange={(e) => {
            // Filter handling logic here
            console.log("Filter by:", e.target.value);
          }}
          defaultValue="all"
        >
          <option value="all">All Streams</option>
          <option value="active">Active Streams</option>
          <option value="scheduled">Scheduled Streams</option>
          <option value="completed">Completed Streams</option>
        </select>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={`${styles.dataTable} ${styles.borderedTable}`}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Loops</th>
              <th>Stream Key</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks
              .slice((activePage - 1) * 10, activePage * 10)
              .map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.hours} loops</td>
                  <td>{task.streamKey}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      task.status === 'active' ? styles.statusActive : 
                      task.status === 'scheduled' ? styles.statusScheduled : 
                      styles.statusCompleted
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.createdDate ? new Date(task.createdDate).toLocaleString() : 'Just now'}</td>
                </tr>
              ))}
            {!tasks.length && (
              <tr>
                <td colSpan="5" className={styles.emptyMessage}>No streams found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {tasks.length > 0 && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton} 
              disabled={activePage === 1}
              onClick={() => setActivePage(activePage - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {activePage} of {Math.ceil(tasks.length / 10)}
            </span>
            <button 
              className={styles.paginationButton} 
              disabled={activePage === Math.ceil(tasks.length / 10)}
              onClick={() => setActivePage(activePage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveHistory; 