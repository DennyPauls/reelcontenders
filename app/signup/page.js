'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SignUp() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}${redirectTarget}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data?.session) {
      router.push(redirectTarget);
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div>
        <header className="rc-header">
          <a href="/" className="rc-brand">🎬 ReelContenders</a>
        </header>
        <div className="rc-sprockets" />
        <main className="rc-page" style={{ maxWidth: 420 }}>
          <h1 className="rc-title">Check Your Email</h1>
          <p className="rc-subtitle">
            We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating
            your account — it&apos;ll take you right back to where you left off.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <header className="rc-header">
        <a href="/" className="rc-brand">🎬 ReelContenders</a>
      </header>
      <div className="rc-sprockets" />

      <main className="rc-page" style={{ maxWidth: 420 }}>
        <h1 className="rc-title">Get Your Ticket</h1>
        <p className="rc-subtitle">Create your ReelContenders account.</p>

        <form onSubmit={handleSignUp} className="rc-form">
          <label className="rc-label">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rc-input"
            />
          </label>
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
              minLength={6}
              className="rc-input"
            />
          </label>
          {error && <p className="rc-error">{error}</p>}
          <button type="submit" disabled={loading} className="rc-btn-primary">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: 20, color: 'var(--color-muted)' }}>
          Already have an account?{' '}
          <a href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}>Log in</a>
        </p>
      </main>
    </div>
  );
}
