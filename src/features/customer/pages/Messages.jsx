import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations, getSentMessages, sendMessage, getProductById } from '../api/customerApi';
import { BASE_URL } from '../../../shared/api/apiClient';
import { useCustomer } from '../contexts/CustomerContext';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmtTime = (dt) => {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const resolveImg = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

/* ── Person icon (fallback avatar) ──────────────────────────────────────── */
const PersonIcon = ({ size = 22, color = '#9CA3AF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={color} />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill={color} />
  </svg>
);

/* ── Avatar: real image or icon fallback ────────────────────────────────── */
const Avatar = ({ src, name, size = 40 }) => {
  const [imgErr, setImgErr] = useState(false);
  const resolved = resolveImg(src);

  if (resolved && !imgErr) {
    return (
      <img
        src={resolved}
        alt={name || 'User'}
        onError={() => setImgErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          background: '#F3F4F6',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <PersonIcon size={size * 0.5} color="#9CA3AF" />
    </div>
  );
};

/* ── Paper-plane send icon ──────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── External link icon ─────────────────────────────────────────────────── */
const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Product inquiry card (clickable) ───────────────────────────────────── */
const ProductCard = ({ msg, isMe, onNavigate }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="View product details"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
        padding: '8px 10px',
        borderRadius: 10,
        background: isMe
          ? hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)'
          : hovered ? 'rgba(0,0,0,0.09)' : 'rgba(0,0,0,0.05)',
        border: isMe ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {/* Product image */}
      {msg.productImage ? (
        <img
          src={resolveImg(msg.productImage)}
          alt={msg.productName}
          style={{
            width: 38,
            height: 38,
            objectFit: 'cover',
            borderRadius: 7,
            background: '#fff',
            flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        />
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: 7, background: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      )}

      {/* Product info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.08em', opacity: 0.7, margin: 0,
        }}>
          Product Inquiry
        </p>
        <p style={{
          fontSize: 12, fontWeight: 700, margin: '2px 0 0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {msg.productName}
        </p>
      </div>

      {/* Arrow icon */}
      <div style={{ opacity: hovered ? 1 : 0.5, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <ExternalIcon />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const CustomerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [newMsg, setNewMsg]               = useState('');
  const [sending, setSending]             = useState(false);
  const [isDarkMode, setIsDarkMode]       = useState(false);
  const { user } = useCustomer();
  const userId   = user?.id;
  const navigate  = useNavigate();

  // Check dark mode on mount and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(localStorage.getItem('customer-theme') === 'dark');
    };
    checkDarkMode();
    window.addEventListener('storage', checkDarkMode);
    return () => window.removeEventListener('storage', checkDarkMode);
  }, []);

  /* ── build grouped conversations ──────────────────────────────────────── */
  const buildGroups = useCallback((inboxMsgs, sentMsgs) => {
    const allMsgs = [...inboxMsgs, ...sentMsgs];
    const groups  = {};

    allMsgs.forEach(msg => {
      const isSenderMe = String(msg.senderId) === String(userId);
      const otherId    = isSenderMe ? msg.receiverId          : msg.senderId;
      const otherName  = isSenderMe ? msg.receiverName         : msg.senderName;
      const otherImg   = isSenderMe ? msg.receiverProfileImage : msg.senderProfileImage;
      if (!otherId) return;

      if (!groups[otherId]) {
        groups[otherId] = {
          id: otherId,
          participantId: otherId,
          participantName: otherName || `User #${otherId}`,
          participantImg: otherImg,
          messages: [],
          unread: 0,
        };
      }
      groups[otherId].messages.push(msg);
      if (!isSenderMe && !msg.isRead) groups[otherId].unread++;
    });

    return Object.values(groups)
      .map(g => {
        g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const last = g.messages[g.messages.length - 1];
        return { ...g, lastMessage: last.content, updatedAt: last.createdAt };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([getConversations(), getSentMessages()]);
      const inbox = Array.isArray(inboxRes.data) ? inboxRes.data : [];
      const sent  = Array.isArray(sentRes.data)  ? sentRes.data  : [];
      const list  = buildGroups(inbox, sent);
      setConversations(list);
      setSelected(prev =>
        prev ? list.find(c => String(c.id) === String(prev.id)) || prev : list[0] || null
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, buildGroups]);

  useEffect(() => { load(); }, [userId]); // eslint-disable-line

  /* ── navigate to product page ─────────────────────────────────────────── */
  const handleProductClick = async (msg) => {
    if (!msg.productId) return;
    try {
      const res = await getProductById(msg.productId);
      const slug = res.data?.slug || res.data?.id || msg.productId;
      navigate(`/product/${slug}`);
    } catch {
      navigate(`/product/${msg.productId}`);
    }
  };

  /* ── send message ─────────────────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    try {
      await sendMessage({ receiverId: selected.participantId, content: newMsg.trim() });
      setNewMsg('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page title */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: isDarkMode ? '#f0f4ff' : '#111827', marginBottom: 20 }}>
        Inbox
      </h2>

      <div style={{ display: 'flex', gap: 16, height: 400 }}>

        {/* ══ LEFT: conversation list ══════════════════════════════════════ */}
        <div style={{
          width: 280, flexShrink: 0, background: isDarkMode ? '#0d1117' : '#fff',
          borderRadius: 16, boxShadow: isDarkMode ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F3F4F6' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6', borderRadius: 6, width: '60%', marginBottom: 6 }} />
                  <div style={{ height: 10, background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6', borderRadius: 6, width: '85%' }} />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#8892a4' : '#9CA3AF', padding: 24, textAlign: 'center' }}>
              <PersonIcon size={40} color={isDarkMode ? '#8892a4' : '#9CA3AF'} />
              <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>No messages yet</p>
              <p style={{ marginTop: 4, fontSize: 11, color: isDarkMode ? '#8892a4' : '#9CA3AF' }}>Your conversations will appear here</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map(conv => {
                const active = selected?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    id={`conv-${conv.id}`}
                    onClick={() => setSelected(conv)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F9FAFB',
                      borderLeft: active ? (isDarkMode ? '3px solid #34D399' : '3px solid #4F46E5') : '3px solid transparent',
                      background: active ? (isDarkMode ? 'rgba(52, 211, 153, 0.1)' : '#F5F5FF') : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                      color: isDarkMode ? '#f0f4ff' : '#111827',
                      border: 'none',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : '#FAFAFA'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? (isDarkMode ? 'rgba(52, 211, 153, 0.1)' : '#F5F5FF') : 'transparent'; }}
                  >
                    <Avatar src={conv.participantImg} name={conv.participantName} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? '#f0f4ff' : '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.participantName}
                      </p>
                      <p style={{ fontSize: 12, color: isDarkMode ? '#8892a4' : '#6B7280', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 400 }}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: isDarkMode ? '#34D399' : '#4F46E5', color: isDarkMode ? '#0d1117' : '#fff',
                        fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ RIGHT: chat panel ════════════════════════════════════════════ */}
        <div style={{
          flex: 1, background: isDarkMode ? '#0d1117' : '#fff', borderRadius: 16,
          boxShadow: isDarkMode ? '0 1px 8px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#8892a4' : '#9CA3AF' }}>
              <PersonIcon size={48} color={isDarkMode ? '#8892a4' : '#D1D5DB'} />
              <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>Select a conversation</p>
              <p style={{ marginTop: 4, fontSize: 12, color: isDarkMode ? '#8892a4' : '#9CA3AF' }}>Choose someone from the left to start chatting</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F3F4F6', background: isDarkMode ? '#0d1117' : '#fff' }}>
                <Avatar src={selected.participantImg} name={selected.participantName} size={36} />
                <span style={{ fontSize: 15, fontWeight: 700, color: isDarkMode ? '#f0f4ff' : '#111827' }}>
                  {selected.participantName}
                </span>
              </div>

              <div style={{
                flex: 1, overflowY: 'auto', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 14, background: isDarkMode ? '#080b14' : '#fff',
              }}>
                {(selected.messages || []).map((msg, i) => {
                  const isMe = String(msg.senderId) === String(userId);
                  return (
                    <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                      {!isMe && <Avatar src={selected.participantImg} name={selected.participantName} size={28} />}
                      <div style={{ maxWidth: '62%' }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? (isDarkMode ? '#34D399' : '#4F46E5') : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F0F0'),
                          color: isMe ? (isDarkMode ? '#0d1117' : '#fff') : (isDarkMode ? '#f0f4ff' : '#1F2937'),
                          fontSize: 13.5,
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.productName && <ProductCard msg={msg} isMe={isMe} onNavigate={() => handleProductClick(msg)} />}
                          {msg.content}
                        </div>
                        <p style={{
                          fontSize: 11, color: isDarkMode ? '#8892a4' : '#9CA3AF', marginTop: 4,
                          textAlign: isMe ? 'right' : 'left', fontWeight: 500,
                        }}>
                          {fmtTime(msg.createdAt)}
                        </p>
                      </div>
                      {isMe && <Avatar src={user?.profileImagePath} name={user?.fullName || user?.username} size={28} />}
                    </div>
                  );
                })}
              </div>

              <div style={{
                padding: '12px 16px', borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', gap: 10, background: isDarkMode ? '#0d1117' : '#fff',
              }}>
                <input
                  id="customer-message-input"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '10px 18px', borderRadius: 24,
                    border: isDarkMode ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid #E5E7EB', 
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FAFAFA',
                    fontSize: 13, color: isDarkMode ? '#f0f4ff' : '#374151', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = isDarkMode ? 'rgba(52, 211, 153, 0.5)' : '#A5B4FC'}
                  onBlur={e => e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}
                />
                <button
                  id="customer-send-btn"
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: sending || !newMsg.trim() ? (isDarkMode ? 'rgba(52, 211, 153, 0.3)' : '#C7D2FE') : (isDarkMode ? '#34D399' : '#4F46E5'),
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer',
                    flexShrink: 0, transition: 'background 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => { if (!sending && newMsg.trim()) e.currentTarget.style.background = isDarkMode ? '#10B981' : '#4338CA'; }}
                  onMouseLeave={e => { if (!sending && newMsg.trim()) e.currentTarget.style.background = isDarkMode ? '#34D399' : '#4F46E5'; }}
                  onMouseDown={e => { if (!sending && newMsg.trim()) e.currentTarget.style.transform = 'scale(0.93)'; }}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerMessages;
