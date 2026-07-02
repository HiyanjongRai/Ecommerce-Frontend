import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Send, Megaphone, Search, User, Users, X, CheckCheck,
  MessageSquare, Loader2, Radio
} from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout/AdminLayout';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import {
  getAdminInbox, getAdminSentMessages,
  sendAdminMessage, broadcastAdminMessage
} from '../../../services/adminApi';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const avatar = (name) => (name || 'U')[0].toUpperCase();

/* ─── sub-components ────────────────────────────────────────────────────────── */
function BroadcastModal({ open, onClose, onSent, themeClasses }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await broadcastAdminMessage(text.trim());
      setResult(res.data);
      setText('');
      setTimeout(() => { onClose(); onSent?.(); setResult(null); }, 2200);
    } catch (e) {
      setResult({ error: e?.response?.data || 'Broadcast failed' });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />
      <div className={`relative rounded-[20px] shadow-2xl w-full max-w-lg overflow-hidden border transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Radio size={18} className="text-white animate-pulse" />
            </div>
            <div>
              <p className="font-black text-white text-xs uppercase tracking-wider">Broadcast Message</p>
              <p className="text-violet-200 text-[10px] font-semibold mt-0.5">Send to all registered users simultaneously</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`p-6 space-y-4 transition-colors ${themeClasses.bg.primary}`}>
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider block transition-colors ${themeClasses.text.tertiary}`}>Message Content</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your message statement to all users…"
              rows={5}
              className={`w-full border rounded-xl px-4 py-3 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
            />
          </div>

          {result && !result.error && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${themeClasses.status.success}`}>
              <CheckCheck size={16} className={`flex-shrink-0 transition-colors ${themeClasses.text.success}`} />
              <p className={`text-xs font-bold transition-colors ${themeClasses.text.success}`}>
                ✓ Broadcast sent to <span className={`font-black transition-colors ${themeClasses.text.success}`}>{result.sent}</span> users
              </p>
            </div>
          )}
          {result?.error && (
            <div className={`p-3 rounded-xl border transition-colors ${themeClasses.status.danger}`}>
              <p className={`text-xs font-bold transition-colors ${themeClasses.text.danger}`}>{result.error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${themeClasses.button.outline}`}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={sending || !text.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />}
              {sending ? 'Sending…' : 'Send to All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function AdminInbox() {
  const { darkMode, themeClasses } = useAdminTheme();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [message, setMessage]             = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const bottomRef = useRef(null);

  /* build grouped conversations from inbox + sent lists */
  const buildConversations = useCallback((inboxMsgs, sentMsgs) => {
    const all = [...inboxMsgs, ...sentMsgs];
    const ADMIN_ROLE = 'ADMIN';
    const groups = {};

    all.forEach(msg => {
      const isMine = msg.senderRole === ADMIN_ROLE;
      const otherId   = isMine ? msg.receiverId   : msg.senderId;
      const otherName = isMine ? msg.receiverName  : msg.senderName;
      const otherImg  = isMine ? msg.receiverProfileImage : msg.senderProfileImage;
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
      if (!isMine && !msg.isRead) groups[otherId].unread++;
    });

    return Object.values(groups).map(g => {
      g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const last = g.messages[g.messages.length - 1];
      return { ...g, lastMessage: last.content, updatedAt: last.createdAt };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        getAdminInbox(),
        getAdminSentMessages(),
      ]);
      const inbox = Array.isArray(inboxRes.data) ? inboxRes.data : [];
      const sent  = Array.isArray(sentRes.data)  ? sentRes.data  : [];
      const list  = buildConversations(inbox, sent);
      setConversations(list);
      setSelected(prev =>
        prev ? list.find(c => String(c.id) === String(prev.id)) || prev : list[0] || null
      );
    } catch (err) {
      console.error('Failed to load admin inbox:', err);
    } finally {
      setLoading(false);
    }
  }, [buildConversations]);

  useEffect(() => { load(); }, [load]);

  /* scroll chat to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selected?.participantId) return;
    setSending(true);
    try {
      await sendAdminMessage({ receiverId: selected.participantId, content: message.trim() });
      setMessage('');
      await load();
    } catch {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(c =>
    !search || c.participantName.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <AdminLayout
      pageTitle="Inbox"
      pageSubtitle="Manage conversations with users and sellers"
      notifications={totalUnread}
      headerActions={
        <button
          id="broadcast-btn"
          onClick={() => setShowBroadcast(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Radio size={13} />
          Message All Users
        </button>
      }
    >
      <div className="flex h-[calc(100vh-112px)] overflow-hidden">

        {/* ── Sidebar: conversation list ─────────────────────────────── */}
        <aside className={`w-72 flex-shrink-0 flex flex-col border-r transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
          {/* Search */}
          <div className={`p-3.5 border-b transition-colors ${themeClasses.border.primary}`}>
            <div className="relative">
              <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 border transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.primary} ${themeClasses.border.primary}`}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 p-3.5 border-b transition-colors ${themeClasses.border.primary}`}>
                  <div className={`w-9 h-9 rounded-full animate-pulse flex-shrink-0 transition-colors ${themeClasses.bg.secondary}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 rounded animate-pulse w-2/3 transition-colors ${themeClasses.bg.secondary}`} />
                    <div className={`h-2.5 rounded animate-pulse w-full transition-colors ${themeClasses.bg.secondary}`} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${themeClasses.bg.secondary}`}>
                  <MessageSquare size={20} className={`transition-colors ${themeClasses.text.tertiary}`} />
                </div>
                <p className={`text-xs font-bold transition-colors ${themeClasses.text.secondary}`}>No conversations yet</p>
                <p className={`text-[10px] font-semibold mt-1 transition-colors ${themeClasses.text.tertiary}`}>Messages will appear here</p>
              </div>
            ) : (
              filtered.map(conv => {
                const active = selected?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    id={`conv-${conv.id}`}
                    onClick={() => setSelected(conv)}
                    className={`w-full text-left flex items-center gap-3 p-3.5 border-b border-l-2 transition-all cursor-pointer ${
                      active
                        ? `bg-emerald-500/5 border-l-emerald-500 ${themeClasses.border.primary}`
                        : `border-l-transparent ${themeClasses.border.primary} hover:${themeClasses.bg.secondary}`
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black shadow-2xs ${
                      active ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : `${themeClasses.bg.tertiary} ${themeClasses.text.secondary}`
                    }`}>
                      {avatar(conv.participantName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-[11px] font-black truncate transition-colors ${themeClasses.text.primary}`}>{conv.participantName}</span>
                        <span className={`text-[9px] font-semibold flex-shrink-0 ml-1 transition-colors ${themeClasses.text.tertiary}`}>{fmtDate(conv.updatedAt)}</span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 font-semibold transition-colors ${themeClasses.text.secondary}`}>{conv.lastMessage}</p>
                    </div>

                    {conv.unread > 0 && (
                      <div className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Stats footer */}
          <div className={`p-3.5 border-t transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${themeClasses.text.tertiary}`}>
              <Users size={11} />
              <span>{conversations.length} conversations</span>
              {totalUnread > 0 && (
                <span className={`ml-auto font-black transition-colors ${themeClasses.text.accent}`}>{totalUnread} unread</span>
              )}
            </div>
          </div>
        </aside>

        {/* ── Chat panel ────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 transition-colors ${themeClasses.bg.primary}`}>
          {selected ? (
            <>
              {/* Chat header */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b shadow-sm transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                  {avatar(selected.participantName)}
                </div>
                <div>
                  <p className={`text-sm font-black transition-colors ${themeClasses.text.primary}`}>{selected.participantName}</p>
                  <p className={`text-[10px] font-semibold mt-0.5 transition-colors ${themeClasses.text.tertiary}`}>User ID: #{selected.participantId}</p>
                </div>
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-5 space-y-3 transition-colors ${themeClasses.bg.primary}`}>
                {selected.messages.map((msg, i) => {
                  const mine = msg.senderRole === 'ADMIN';
                  const showDate = i === 0 || fmtDate(msg.createdAt) !== fmtDate(selected.messages[i - 1]?.createdAt);
                  return (
                    <React.Fragment key={msg.id || i}>
                      {showDate && (
                        <div className="flex justify-center my-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.tertiary}`}>
                            {fmtDate(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        {!mine && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black mr-2 flex-shrink-0 self-end transition-colors ${themeClasses.bg.secondary} ${themeClasses.text.secondary}`}>
                            {avatar(selected.participantName)}
                          </div>
                        )}
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs transition-colors ${
                            mine
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-none'
                              : `border rounded-bl-none ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 transition-colors ${mine ? 'justify-end' : 'justify-start'} ${themeClasses.text.tertiary}`}>
                            {fmt(msg.createdAt)}
                            {mine && msg.isRead && <CheckCheck size={10} className="text-emerald-400" />}
                          </div>
                        </div>
                        {mine && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black ml-2 flex-shrink-0 self-end shadow-2xs">
                            A
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className={`flex items-end gap-2 px-4 py-3 border-t shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.06)] transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
                <div className="flex-1 relative">
                  <textarea
                    id="admin-message-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder="Type a message… (Enter to send)"
                    rows={1}
                    className={`w-full border rounded-2xl px-4 py-2.5 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none transition-all max-h-32 overflow-y-auto ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                    style={{ minHeight: '40px' }}
                  />
                </div>
                <button
                  id="admin-send-btn"
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white flex items-center justify-center flex-shrink-0 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 transition-colors ${themeClasses.bg.primary}`}>
              <div className={`w-20 h-20 rounded-[20px] flex items-center justify-center mb-4 transition-colors ${themeClasses.bg.secondary}`}>
                <MessageSquare size={36} className={`transition-colors ${themeClasses.text.accent}`} />
              </div>
              <h3 className={`text-base font-black mb-1 transition-colors ${themeClasses.text.primary}`}>No conversation selected</h3>
              <p className={`text-xs max-w-xs transition-colors ${themeClasses.text.tertiary}`}>
                Pick a conversation from the left, or use{' '}
                <button
                  onClick={() => setShowBroadcast(true)}
                  className="text-violet-600 font-black hover:underline cursor-pointer"
                >
                  Message All Users
                </button>
                {' '}to broadcast to everyone.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className={`rounded-xl border p-4 text-center shadow-xs transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
                  <p className={`text-xl font-black transition-colors ${themeClasses.text.primary}`}>{conversations.length}</p>
                  <p className={`text-[9px] font-black uppercase tracking-wider mt-1 transition-colors ${themeClasses.text.tertiary}`}>Conversations</p>
                </div>
                <div className={`rounded-xl border p-4 text-center shadow-xs transition-colors ${themeClasses.card} ${themeClasses.border.primary}`}>
                  <p className={`text-xl font-black transition-colors ${themeClasses.text.accent}`}>{totalUnread}</p>
                  <p className={`text-[9px] font-black uppercase tracking-wider mt-1 transition-colors ${themeClasses.text.tertiary}`}>Unread</p>
                </div>
              </div>

              <button
                onClick={() => setShowBroadcast(true)}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Radio size={13} />
                Broadcast to All Users
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast modal */}
      <BroadcastModal
        open={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        onSent={load}
        themeClasses={themeClasses}
      />
    </AdminLayout>
  );
}
