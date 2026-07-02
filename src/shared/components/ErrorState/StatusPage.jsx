import React from 'react';

const copy = {
  401: {
    title: 'Session expired',
    description: 'Please sign in again to continue.',
    action: 'Go to login',
    actionHref: '/',
  },
  403: {
    title: 'Access denied',
    description: 'You do not have permission to view this page.',
    action: 'Go back',
    actionHref: '/',
  },
  404: {
    title: 'Page not found',
    description: 'The page you were looking for does not exist or has moved.',
    action: 'Go home',
    actionHref: '/',
  },
  500: {
    title: 'Something went wrong',
    description: 'Please refresh the page or try again in a moment.',
    action: 'Refresh page',
    actionHref: null,
  },
  offline: {
    title: 'You are offline',
    description: 'Check your internet connection and try again once you are back online.',
    action: 'Retry',
    actionHref: null,
  },
};

export default function StatusPage({ code = '404', onRetry }) {
  const details = copy[code] || copy[404];

  const handleAction = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    if (details.actionHref) {
      window.location.href = details.actionHref;
      return;
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(135deg,_#0f172a,_#111827_55%,_#020617)] px-4">
      <div className="max-w-lg w-full rounded-[2rem] border border-white/10 bg-white/8 backdrop-blur-xl shadow-2xl p-8 text-white">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Jhapcham</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{details.title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/75">{details.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={handleAction}
            className="inline-flex items-center justify-center rounded-full bg-green-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-green-300 transition-colors"
          >
            {details.action}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
