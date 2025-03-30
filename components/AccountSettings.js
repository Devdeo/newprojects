import styles from '../styles/Dashboard.module.css';

const AccountSettings = ({ userInfo }) => {
  return (
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
  );
};

export default AccountSettings; 