'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <p style={{ margin: 40 }}>Loading...</p>;

  return (
    <main style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px' }}>
      <h1>🎬 Welcome to ReelContenders</h1>
      <p>You&apos;re logged in as <strong>{user?.email}</strong></p>
      <p style={{ color: '#666' }}>
        This is a placeholder dashboard. League creation and the draft board get built here next.
      </p>
      <button onClick={handleLogout} style={buttonStyle}>Log Out</button>
    </main>
  );
}

const buttonStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#1a1a1a',
  color: 'white',
  fontSize: 16,
  cursor: 'pointer',
  marginTop: 16,
};
