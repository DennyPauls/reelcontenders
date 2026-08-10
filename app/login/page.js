'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Header from '../components/Header';

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(redirectTarget);
    }
  }

  return (
    <div>
      <Header />

      <main className="rc-page" style={{ maxWidth: 420 }}>
        <h1 className="rc-title">Log In</h1>
        <p className="rc-subtitle">Welcome back to the theater.</p>

        <form onSubmit={handleLogin} className="rc-form">
          <label className="rc-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rc-input"
            />
          </label>
          <label className="rc-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rc-input"
            />
          </label>
          {error && <p className="rc-error">{error}</p>}
          <button type="submit" disabled={loading} className="rc-btn-primary">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ marginTop: 20, color: 'var(--color-muted)' }}>
          Don&apos;t have an account?{' '}
          <a href={`/signup?redirect=${encodeURIComponent(redirectTarget)}`}>Sign up</a>
        </p>
      </main>
    </div>
  );
}
