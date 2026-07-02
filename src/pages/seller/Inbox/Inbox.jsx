import React, { useCallback, useEffect, useState } from 'react';
import { getSellerConversations, getSellerSentMessages, getSellerProfile, sendSellerMessage, markSellerMessagesRead } from '../../../services/sellerApi';
import { BASE_URL } from '../../../services/apiClient';
import { EmptyState, LoadingState, SectionHeader } from '../SectionUtils/SectionUtils';
import { useSellerTheme } from '../../../hooks/useSellerTheme';
import { Sparkles, RefreshCw } from 'lucide-react';

const SellerInbox = () => {
  const { darkMode, themeClasses } = useSellerTheme();
  const isDark = darkMode;

  const [sellerUserId, setSellerUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, inboxRes, sentRes] = await Promise.all([
        getSellerProfile(),
        getSellerConversations(),
        getSellerSentMessages()
      ]);
      const myId = profileRes.data?.userId;
      setSellerUserId(myId);

      const inboxMsgs = Array.isArray(inboxRes.data) ? inboxRes.data : [];
      const sentMsgs = Array.isArray(sentRes.data) ? sentRes.data : [];
      const allMsgs = [...inboxMsgs, ...sentMsgs];
      const groups = {};

      allMsgs.forEach(msg => {
        const isSenderMe = String(msg.senderId) === String(myId);
        const otherId = isSenderMe ? msg.receiverId : msg.senderId;
        const otherName = isSenderMe ? msg.receiverName : msg.senderName;
        const otherImg = isSenderMe ? msg.receiverProfileImage : msg.senderProfileImage;

        if (!otherId) return;

        if (!groups[otherId]) {
          groups[otherId] = {
            id: otherId,
            participantId: otherId,
            participantName: otherName,
            participantProfileImage: otherImg,
            messages: []
          };
        }
        groups[otherId].messages.push(msg);
      });

      const list = Object.values(groups).map(g => {
        g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const lastMsg = g.messages[g.messages.length - 1];
        return {
          ...g,
          lastMessage: lastMsg.content,
          updatedAt: lastMsg.createdAt
        };
      });

      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(list);
      
      setSelected((current) => {
        if (!current) return list[0] || null;
        return list.find((item) => String(item.id) === String(current.id)) || current;
      });
    } catch (err) {
      console.error("Failed to load seller inbox:", err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || !selected?.participantId) return;
    setSending(true);
    try {
      await sendSellerMessage({ receiverId: selected.participantId, content: message.trim() });
      setMessage('');
      
      // Update local view by re-fetching and grouping
      const [inboxRes, sentRes] = await Promise.all([
        getSellerConversations(),
        getSellerSentMessages()
      ]);

      const inboxMsgs = Array.isArray(inboxRes.data) ? inboxRes.data : [];
      const sentMsgs = Array.isArray(sentRes.data) ? sentRes.data : [];
      const allMsgs = [...inboxMsgs, ...sentMsgs];
      const groups = {};

      allMsgs.forEach(msg => {
        const isSenderMe = String(msg.senderId) === String(sellerUserId);
        const otherId = isSenderMe ? msg.receiverId : msg.senderId;
        const otherName = isSenderMe ? msg.receiverName : msg.senderName;
        const otherImg = isSenderMe ? msg.receiverProfileImage : msg.senderProfileImage;

        if (!otherId) return;

        if (!groups[otherId]) {
          groups[otherId] = {
            id: otherId,
            participantId: otherId,
            participantName: otherName,
            participantProfileImage: otherImg,
            messages: []
          };
        }
        groups[otherId].messages.push(msg);
      });

      const list = Object.values(groups).map(g => {
        g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const lastMsg = g.messages[g.messages.length - 1];
        return {
          ...g,
          lastMessage: lastMsg.content,
          updatedAt: lastMsg.createdAt
        };
      });

      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(list);

      const match = list.find(c => String(c.id) === String(selected.id));
      if (match) {
        setSelected(match);
      }
    } catch {
      setSendError('Failed to send message. Please try again.');
      setTimeout(() => setSendError(''), 4000);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelected(conversation);
    try {
      await markSellerMessagesRead(conversation.participantId);
    } catch (err) {
      console.error('Failed to mark seller messages as read:', err);
    }
  };

  if (loading && conversations.length === 0) return <LoadingState label="Loading inbox..." />;

  return (
    <div className={`space-y-4 max-w-[1400px] animate-in fade-in duration-300 font-sans ${themeClasses.bg.primary}`}>
      
      {/* ── Page Header Banner ── */}
      <SectionHeader
        title="Seller Messaging Desk"
        subtitle="Read customer conversations and reply from your seller account."
        tag="Communications"
        action={
          <button
            onClick={load}
            className="bg-white hover:bg-gray-150 text-gray-900 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-gray-200 shadow-sm h-10"
          >
            <RefreshCw size={12} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />
            Sync Messages
          </button>
        }
      />

      {conversations.length === 0 ? (
        <div className={`border rounded-2xl p-10 text-center shadow-sm transition-colors ${isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>No conversations</h3>
          <p className="text-[10px] text-gray-500 font-semibold">Customer messages will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-[calc(100vh-320px)] min-h-[460px]">
          
          {/* Sidebar Conversations */}
          <div className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col ${isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b ${isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Conversations</h3>
            </div>
            <div className={`flex-1 overflow-y-auto divide-y ${isDark ? 'divide-white/5' : 'divide-gray-50'} custom-scrollbar`}>
              {conversations.map((conversation) => {
                const active = selected?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation)}
                    className={`w-full block text-left p-3 border-l-2 transition-colors cursor-pointer bg-transparent border-t-0 border-r-0 border-b-0 rounded-none shadow-none hover:translate-y-0 ${
                      active 
                        ? 'bg-[#16A34A]/10 border-[#16A34A]' 
                        : `border-transparent ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`
                    }`}
                  >
                    <div className="flex justify-between gap-2.5">
                      <span className={`text-[11px] font-black truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{conversation.participantName || `Customer #${conversation.participantId}`}</span>
                      <span className="text-[8px] font-bold text-gray-400">{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p className={`text-[11px] font-semibold truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{conversation.lastMessage || 'No messages yet'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Section */}
          <div className={`lg:col-span-2 border rounded-2xl overflow-hidden shadow-sm flex flex-col ${isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b ${isDark ? 'border-white/10 bg-[#111827]' : 'border-gray-100 bg-gray-55'}`}>
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-gray-800'}`}>{selected?.participantName || `Customer #${selected?.participantId}`}</h3>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${isDark ? 'bg-[#111827]/30' : 'bg-gray-50/40'}`}>
              {(selected?.messages || []).map((item, index) => {
                const mine = sellerUserId != null && String(item.senderId) === String(sellerUserId);
                return (
                  <div key={index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                      mine 
                        ? 'bg-[#16A34A] text-white shadow-[0_0_12px_rgba(5,146,18,0.15)]' 
                        : (isDark ? 'bg-[#111827] border border-white/10 text-white' : 'bg-white text-gray-800 border border-gray-100')
                    }`}>
                      {item.productName && (
                        <div className={`mb-2 p-1.5 rounded-xl border flex items-center gap-2 text-[10px] font-semibold ${
                          mine 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : (isDark ? 'bg-black/40 border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-gray-800')
                        }`}>
                          {item.productImage && (
                            <img
                              src={item.productImage.startsWith('http') ? item.productImage : `${BASE_URL}${item.productImage.startsWith('/') ? '' : '/'}${item.productImage}`}
                              alt={item.productName}
                              className="w-7 h-7 object-contain bg-white rounded shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1 text-left">
                            <span className="text-[7px] uppercase tracking-wider opacity-75 block font-black">Product Inquiry</span>
                            <span className="truncate block font-bold text-[9px]">{item.productName}</span>
                          </div>
                        </div>
                      )}
                      <div>{item.content}</div>
                      <div className={`text-[8px] font-bold uppercase tracking-wider mt-1.5 ${mine ? 'text-[#e8f5ee]/80 text-right' : 'text-gray-400'}`}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Message input controls */}
            <form onSubmit={handleSubmit} className={`p-3 border-t flex flex-col gap-2 ${isDark ? 'border-white/10 bg-[#0b0c10]' : 'border-gray-100 bg-white'}`}>
              {sendError && (
                <div className={`p-3 border rounded-xl text-xs font-black flex items-center gap-1.5 tracking-wide uppercase ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-55 border-red-200 text-red-700'}`}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {sendError}
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  value={message} 
                  onChange={(event) => setMessage(event.target.value)} 
                  placeholder="Type a reply..." 
                  className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors border ${
                    isDark 
                      ? 'bg-[#111827] border-white/10 text-white focus:border-[#16A34A]' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#16A34A]'
                  }`} 
                />
                <button 
                  disabled={sending || !message.trim()} 
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 border-0 bg-[#16A34A] text-white hover:bg-[#152F17]"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerInbox;
