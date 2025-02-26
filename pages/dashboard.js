import {useState, useEffect} from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Dashboard from '../components/Dashboard';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

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
