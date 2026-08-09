'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: '0 20px' }}>
      <h1>🎬 Create your ReelContenders account</h1>
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          style={inputStyle}
        />
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
          minLength={6}
          style={inputStyle}
        />
        {error && <p style={{ color: '#c62828' }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Log in</a>
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
