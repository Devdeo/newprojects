
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Page.module.css';

export default function RefundPolicy() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Payment Refund Policy - Video Loop Streaming</title>
      </Head>
      <Navbar />
      <main className={styles.main}>
        <h1>Payment Refund Policy</h1>
        <div className={styles.content}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Payment Processing</h2>
          <ul>
            <li><strong>Secure Transactions:</strong> All payments are processed securely via approved payment gateways.</li>
            <li><strong>Accepted Payment Methods:</strong> We accept major credit cards, debit cards, and other electronic payment methods as indicated during the checkout process.</li>
          </ul>

          <h2>2. Refund Eligibility</h2>
          <ul>
            <li><strong>Service Interruptions or Errors:</strong> Refunds may be available if you experience service interruptions, technical issues, or billing errors that are attributable to our platform.</li>
            <li><strong>Dissatisfaction:</strong> In cases where you are not satisfied with the quality or performance of our services, you may be eligible for a refund provided you notify us within the specified timeframe.</li>
            <li><strong>Non-Refundable Services:</strong> Services that have been fully rendered or where usage has exceeded a set threshold may be deemed non-refundable.</li>
          </ul>

          <h2>3. Refund Request Process</h2>
          <ul>
            <li><strong>Submission Window:</strong> Refund requests must be submitted within 30 days from the date of the original transaction.</li>
            <li><strong>How to Request:</strong> Contact our support team at support@videoloopstreaming.com</li>
            <li><strong>Required Information:</strong> Include your order number, transaction details, and reason for the refund request.</li>
            <li><strong>Review Period:</strong> Our team will review your request and notify you of the decision within 5 business days.</li>
          </ul>

          <h2>4. Refund Approval and Processing</h2>
          <ul>
            <li><strong>Approval:</strong> If approved, the refund will be processed using the same payment method used for the original transaction.</li>
            <li><strong>Processing Time:</strong> Please allow up to 7 business days for the refund to be reflected on your account.</li>
          </ul>

          <h2>5. Exceptions and Non-Refundable Situations</h2>
          <ul>
            <li><strong>Fully Rendered Services:</strong> Refunds are not available for services already fully rendered or consumed.</li>
            <li><strong>Partial Use:</strong> For partially used services, only a partial refund may be granted at our discretion.</li>
            <li><strong>Special Circumstances:</strong> Other exceptional circumstances will be handled case-by-case.</li>
          </ul>

          <h2>6. Changes to This Policy</h2>
          <ul>
            <li><strong>Policy Updates:</strong> We reserve the right to modify this policy at any time.</li>
            <li><strong>Continued Use:</strong> Continued use of our services following changes constitutes acceptance of new terms.</li>
          </ul>

          <h2>7. Contact Information</h2>
          <p>For questions about our Payment Refund Policy, contact us at:</p>
          <p>Video Loop Streaming<br />
          support@videoloopstreaming.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
