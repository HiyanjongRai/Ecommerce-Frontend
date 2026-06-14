import React, { useCallback, useEffect, useState } from 'react';
import { getSellerConversations, getSellerSentMessages, getSellerProfile, sendSellerMessage, markSellerMessagesRead } from '../services/sellerService';
import { BASE_URL } from '../../../shared/api/apiClient';
import { EmptyState, LoadingState, SectionHeader } from './SellerSectionUtils';

const SellerInbox = () => {
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
    <div className="space-y-3.5">
      <SectionHeader title="Inbox" subtitle="Read customer conversations and reply from your seller account." />

      {conversations.length === 0 ? (
        <EmptyState title="No conversations" text="Customer messages will appear here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 h-[calc(100vh-320px)] min-h-[460px]">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-700">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {conversations.map((conversation) => {
                const active = selected?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation)}
                    className={`w-full text-left p-3 border-l-2 transition-colors ${active ? 'bg-emerald-50 border-emerald-600' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between gap-2.5">
                      <span className="text-[11px] font-black text-gray-800 truncate">{conversation.participantName || `Customer #${conversation.participantId}`}</span>
                      <span className="text-[8px] font-bold text-gray-400">{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-semibold truncate mt-0.5">{conversation.lastMessage || 'No messages yet'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-700">{selected?.participantName || `Customer #${selected?.participantId}`}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-3">
              {(selected?.messages || []).map((item, index) => {
                const mine = sellerUserId != null && String(item.senderId) === String(sellerUserId);
                return (
                  <div key={index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-sm text-[11px] leading-relaxed shadow-sm ${mine ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 border border-gray-100'}`}>
                      {item.productName && (
                        <div className={`mb-2 p-1.5 rounded-sm border flex items-center gap-2 text-[10px] font-semibold ${mine ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
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
                      <div className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${mine ? 'text-emerald-100 text-right' : 'text-gray-400'}`}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSubmit} className="p-2.5 border-t border-gray-100 flex flex-col gap-2">
              {sendError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-sm text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {sendError}
                </div>
              )}
              <div className="flex gap-2">
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a reply..." className="flex-1 bg-gray-50 border border-gray-200 rounded-sm px-3 py-1.5 text-xs font-semibold outline-none focus:border-gray-400 transition-colors" />
                <button disabled={sending || !message.trim()} className="bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-sm">
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
