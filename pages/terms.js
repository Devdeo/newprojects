
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function Terms() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Terms & Conditions - Video Loop Streaming</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>Terms & Conditions</h1>
        <div className={styles.content}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <p>Welcome to Video Loop Streaming ("we", "us", or "our"). These Terms & Conditions ("Terms") govern your access to and use of our website and services—including uploading videos and livestreaming ("Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our Services.</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By using our Services, you confirm that you are at least 18 years old (or have parental consent) and agree to comply with these Terms. Your continued access to our Services constitutes your acceptance of any modifications to these Terms.</p>

          <h2>2. Modification of Terms</h2>
          <p>We reserve the right to update or change these Terms at any time. We will notify you of any significant changes by posting the revised Terms on our website. Your continued use of our Services after such changes constitutes acceptance of the updated Terms.</p>

          <h2>3. User Responsibilities</h2>
          <ul>
            <li><strong>Account Registration:</strong> If you create an account, you agree to provide accurate, current, and complete information. You are responsible for safeguarding your login credentials.</li>
            <li><strong>Content Submission:</strong> You are solely responsible for any content you upload or livestream. By submitting content, you confirm that it does not violate any applicable laws or infringe upon the rights of third parties.</li>
            <li><strong>Compliance:</strong> You agree to use our Services only for lawful purposes and in accordance with these Terms.</li>
          </ul>

          <h2>4. Prohibited Conduct</h2>
          <p>You agree not to engage in any activities that could harm our Services or other users. Prohibited conduct includes, but is not limited to:</p>
          <ul>
            <li>Uploading or transmitting harmful, defamatory, obscene, or infringing content.</li>
            <li>Unauthorized use of the platform to violate any local, national, or international laws.</li>
            <li>Attempting to disrupt or interfere with the proper functioning of our Services.</li>
          </ul>

          <h2>5. Content Ownership and Licensing</h2>
          <ul>
            <li><strong>User Content:</strong> You retain ownership of any content you upload. However, by uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, distribute, and display your content in connection with providing and promoting our Services.</li>
            <li><strong>Our Content:</strong> All content, trademarks, and intellectual property on our website (excluding user content) are owned by Video Loop Streaming or our licensors and are protected by intellectual property laws. You agree not to reproduce or use any of our content without prior written consent.</li>
          </ul>

          <h2>6. Disclaimers and Limitation of Liability</h2>
          <ul>
            <li><strong>No Warranty:</strong> Our Services are provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not guarantee that our Services will be uninterrupted, error-free, or completely secure.</li>
            <li><strong>Limitation of Liability:</strong> In no event shall Video Loop Streaming be liable for any indirect, incidental, consequential, or punitive damages arising out of your use of our Services. Our total liability shall not exceed the amount you have paid, if any, for accessing our Services.</li>
          </ul>

          <h2>7. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless Video Loop Streaming, its affiliates, and their respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to your use of our Services or your breach of these Terms.</p>

          <h2>8. Termination</h2>
          <p>We reserve the right to suspend or terminate your account or access to our Services at our sole discretion, particularly if you violate these Terms. Termination may be implemented without prior notice.</p>

          <h2>9. Governing Law and Dispute Resolution</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising under or in connection with these Terms shall be resolved through binding arbitration or in the appropriate courts located within the United States.</p>

          <h2>10. Contact Information</h2>
          <p>If you have any questions or concerns about these Terms, please contact us at:</p>
          <p>Video Loop Streaming<br />
          support@videoloopstreaming.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
