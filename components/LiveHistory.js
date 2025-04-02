import { useState } from 'react';
import styles from '../styles/Dashboard.module.css';

const LiveHistory = ({ tasks }) => {
  const [activePage, setActivePage] = useState(1);

  // Create a sorted copy of tasks with the most recent (by createdDate) first
  const sortedTasks = [...tasks].sort((a, b) => {
    const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div>
      <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Live Stream History</h2>
      <div className={styles.tableContainer}>
        <table className={`${styles.dataTable} ${styles.borderedTable}`}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Loops</th>
              <th>Stream Key</th>
             
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks
              .slice((activePage - 1) * 10, activePage * 10)
              .map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.hours} loops</td>
                  <td>{task.streamKey}</td>
                 
                  <td>{task.createdDate ? new Date(task.createdDate).toLocaleString() : 'Just now'}</td>
                </tr>
              ))}
            {!sortedTasks.length && (
              <tr>
                <td colSpan="5" className={styles.emptyMessage}>No streams found.</td>
              </tr>
            )}
          </tbody>
        </table>

        {sortedTasks.length > 0 && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton} 
              disabled={activePage === 1}
              onClick={() => setActivePage(activePage - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {activePage} of {Math.ceil(sortedTasks.length / 10)}
            </span>
            <button 
              className={styles.paginationButton} 
              disabled={activePage === Math.ceil(sortedTasks.length / 10)}
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
