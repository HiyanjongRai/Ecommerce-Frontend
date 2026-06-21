import { useEffect } from 'react';

/**
 * Google OAuth 2.0 Callback Page
 * ─────────────────────────────────────────────────────────────────
 * Route: /auth/google/callback
 *
 * After the user selects a Google account in the popup, Google
 * redirects here with the ID token in the URL fragment:
 *   #id_token=<JWT>&token_type=Bearer&...
 *
 * This page:
 *  1. Reads the id_token from the hash
 *  2. Sends it to the opener window (Register page) via postMessage
 *  3. Closes itself
 *
 * If opened outside a popup (direct navigation), it redirects home.
 */
export default function GoogleAuthCallback() {
  useEffect(() => {
    const hash   = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token  = hash.get('id_token');
    const error  = hash.get('error');

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'GOOGLE_OAUTH_RESULT', idToken: token, error: error || null },
        window.location.origin
      );
      window.close();
    } else {
      // Opened directly (not as a popup) — just go home
      window.location.replace('/');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: '#F0F4F0',
      gap: 14,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #E5E7EB',
        borderTopColor: '#16A34A',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      <p style={{ color: '#4B5563', fontSize: 14, fontWeight: 500 }}>
        Completing Google sign-in…
      </p>
    </div>
  );
}
