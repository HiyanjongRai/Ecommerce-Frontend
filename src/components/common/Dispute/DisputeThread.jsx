import React, { useState, useEffect, useRef } from 'react';
import { Send, File, Paperclip, X, Shield } from 'lucide-react';
import { getDisputeMessages, sendDisputeMessage } from '../../../services/customerApi';

/* ─── helpers ──────────────────────────────────────────────────── */
const relativeTime = (value) => {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ROLE_CONFIG = {
  BUYER:  { label: 'Buyer',  bg: 'bg-blue-600',    light: 'bg-blue-50  border-blue-200  text-blue-900',  avatar: 'bg-blue-100 text-blue-700'  },
  SELLER: { label: 'Seller', bg: 'bg-emerald-600',  light: 'bg-emerald-50 border-emerald-200 text-emerald-900', avatar: 'bg-emerald-100 text-emerald-700' },
  ADMIN:  { label: 'Admin',  bg: 'bg-violet-600',   light: 'bg-violet-50 border-violet-200 text-violet-900', avatar: 'bg-violet-100 text-violet-700'  },
};
const roleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.BUYER;

/* ─── Component ─────────────────────────────────────────────────── */
export default function DisputeThread({ disputeId, publicReferenceId, currentRole, onUpdate }) {
  const [messages,      setMessages]      = useState([]);
  const [newMessage,    setNewMessage]    = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttach,    setShowAttach]    = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await getDisputeMessages(disputeId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load dispute messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (disputeId) fetchMessages();
  }, [disputeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachmentUrl.trim()) return;
    try {
      setSending(true);
      await sendDisputeMessage(disputeId, { message: newMessage, attachmentUrl });
      setNewMessage('');
      setAttachmentUrl('');
      setShowAttach(false);
      await fetchMessages();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to send message', err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
         style={{ height: '520px' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-emerald-600" />
          <h3 className="font-bold text-gray-800 text-sm">Dispute Discussion</h3>
        </div>
        <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          {publicReferenceId || `#${disputeId}`}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400 font-medium">Loading messages…</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Shield size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe    = msg.role === currentRole;
            const cfg     = roleConfig(msg.role);
            const initials = (msg.role || 'U').slice(0, 2).toUpperCase();

            return (
              <div key={idx} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${cfg.avatar}`}>
                  {initials}
                </div>

                <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Role + time */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${isMe ? 'text-gray-500' : 'text-gray-600'}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[9px] text-gray-400">{relativeTime(msg.createdAt)}</span>
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words ${
                    isMe
                      ? `${cfg.bg} text-white rounded-tr-sm`
                      : `bg-white border ${cfg.light.split(' ').slice(1).join(' ')} rounded-tl-sm`
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    {msg.attachmentUrl && (
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                          isMe ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <File size={12} />
                        View Attachment
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-3 shrink-0">
        <form onSubmit={handleSend} className="flex flex-col gap-2">

          {/* Collapsible attachment URL field */}
          {showAttach && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <File size={13} className="text-blue-500 shrink-0" />
              <input
                type="url"
                value={attachmentUrl}
                onChange={e => setAttachmentUrl(e.target.value)}
                placeholder="Paste attachment URL (https://…)"
                className="flex-1 bg-transparent text-xs text-blue-900 font-medium outline-none placeholder-blue-400"
              />
              <button
                type="button"
                onClick={() => { setAttachmentUrl(''); setShowAttach(false); }}
                className="text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Message row */}
          <div className="flex gap-2 items-end">
            {/* Paperclip toggle */}
            <button
              type="button"
              title="Attach a link"
              onClick={() => setShowAttach(s => !s)}
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                showAttach || attachmentUrl
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Paperclip size={17} />
            </button>

            {/* Textarea */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-center overflow-hidden
                            focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-2
                            focus-within:ring-emerald-400/20 transition-all">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 resize-none
                           py-3 px-4 text-sm text-gray-800 min-h-[44px] max-h-[100px] leading-relaxed"
                rows={1}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                }}
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={sending || (!newMessage.trim() && !attachmentUrl)}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white
                         p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                         shrink-0 shadow-sm"
              title="Send message"
            >
              {sending
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                : <Send size={17} />
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
