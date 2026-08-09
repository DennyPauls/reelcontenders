'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: '0 20px' }}>
      <h1>🎬 Log in to ReelContenders</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: '#c62828' }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Don&apos;t have an account? <a href="/signup">Sign up</a>
      </p>
    </main>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 16,
};

const buttonStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#1a1a1a',
  color: 'white',
  fontSize: 16,
  cursor: 'pointer',
};
