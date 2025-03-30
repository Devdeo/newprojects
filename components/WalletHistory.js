import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';

const WalletHistory = ({ creditBalance, transactions }) => {
  const router = useRouter();
  const [walletPage, setWalletPage] = useState(1);

  return (
    <div>
      <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Wallet History</h2>
      <div className={styles.walletSummary}>
        <div className={styles.walletBalance}>
          <h3>Current Balance</h3>
          <p className={styles.balanceAmount}>{creditBalance.toFixed(2)} credits</p>
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
                <th>Description</th>
                <th>Amount</th>
                <th>Quantity</th>
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
                      <td>{transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
                      <td>
                        {transaction.type === 'credit_purchase' 
                          ? 'Credit Purchase' 
                          : transaction.description || 'Transaction'}
                      </td>
                      <td>
                        {transaction.amount !== undefined 
                          ? `₹${parseFloat(transaction.amount).toFixed(2)}` 
                          : 'N/A'}
                      </td>
                      <td>
                        {transaction.amount !== undefined 
                          ? `${transaction.amount} credits` 
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          transaction.type === 'credit_purchase' || transaction.type === 'credit' 
                            ? styles.statusCredit 
                            : styles.statusDebit
                        }`}>
                          {transaction.type || 'transaction'}
                        </span>
                      </td>
                      <td>{transaction.balance !== undefined ? `${transaction.balance.toFixed(2)} credits` : `${creditBalance.toFixed(2)} credits`}</td>
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
  );
};

export default WalletHistory; 