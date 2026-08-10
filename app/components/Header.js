'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="rc-header">
        <a href="/" className="rc-brand">🎬 ReelContenders</a>
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user ? (
              <>
                <span className="rc-stat">
                  {user.user_metadata?.display_name || user.email}
                </span>
                <button onClick={handleLogout} className="rc-btn-secondary">Log Out</button>
              </>
            ) : (
              <>
                <a href="/login" className="rc-btn-secondary">Log In</a>
                <a href="/signup" className="rc-btn-primary">Sign Up</a>
              </>
            )}
          </div>
        )}
      </header>
      <div className="rc-sprockets" />
    </>
  );
}
