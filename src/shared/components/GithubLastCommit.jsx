import React, { useEffect, useState } from 'react';

const REPO = 'HiyanjongRai/Ecommerce-Frontend';
const API_URL = `https://api.github.com/repos/${REPO}/commits?per_page=1`;

export default function GitHubLastCommit() {
  const [commit, setCommit] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLastCommit() {
      try {
        const response = await fetch(API_URL, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const gitCommit = Array.isArray(data) && data[0];
        if (!gitCommit) {
          throw new Error('No commit data found');
        }

        const commitData = {
          sha: gitCommit.sha,
          message: gitCommit.commit?.message?.split('\n')[0] || 'Update',
          author: gitCommit.commit?.author?.name || 'Unknown',
          date: gitCommit.commit?.author?.date ? new Date(gitCommit.commit.author.date).toLocaleDateString() : 'Unknown date',
          url: gitCommit.html_url,
        };

        if (!cancelled) {
          setCommit(commitData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLastCommit();
    return () => {
      cancelled = true;
    };
  }, []);

  const wrapperStyle = {
    fontSize: '0.72rem',
    opacity: 0.78,
    textAlign: 'right',
    lineHeight: 1.4,
  };

  if (loading) {
    return <div style={wrapperStyle}>Loading latest GitHub commit…</div>;
  }

  if (error || !commit) {
    return <div style={wrapperStyle}>Latest GitHub commit unavailable.</div>;
  }

  return (
    <div style={wrapperStyle}>
      <div>Last GitHub commit:</div>
      <div>
        <a href={commit.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}>
          {commit.message}
        </a>
      </div>
      <div>{commit.author} · {commit.date}</div>
    </div>
  );
}
