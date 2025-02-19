
import Head from 'next/head';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  return (
    <div>
      <Head>
        <title>Dashboard - My Site</title>
        <meta name="description" content="User dashboard" />
      </Head>
      <Navbar />
      <Dashboard />
    </div>
  );
};

export default DashboardPage;
