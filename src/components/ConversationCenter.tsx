import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Bot, CheckCircle2, Globe, Mail } from 'lucide-react';
import { Conversation, Message } from '../types/index.js';

interface ConversationCenterProps {
  lang: 'am' | 'en';
}

export const ConversationCenter: React.FC<ConversationCenterProps> = ({ lang }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.conversations?.length > 0 && !selectedConvId) {
        setSelectedConvId(data.conversations[0].id);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleApprove = async (msgId: string) => {
    try {
      await fetch(`/api/messages/${msgId}/approve`, { method: 'POST' });
      fetchConversations();
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleSend = async (msgId: string) => {
    try {
      await fetch(`/api/messages/${msgId}/send`, { method: 'POST' });
      fetchConversations();
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[600px] flex flex-col md:flex-row">
      {/* Sidebar Thread List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-3 bg-slate-950/60">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>{lang === 'am' ? 'Վաճառքի Զրույցներ' : 'Sales Center Threads'}</span>
        </h3>

        <div className="space-y-2 overflow-y-auto max-h-[500px]">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                selectedConvId === conv.id
                  ? 'bg-blue-950/60 border-blue-700/80'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-xs">{conv.company_name}</span>
                <span className="text-[10px] font-semibold uppercase text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {conv.channel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {conv.messages?.[0]?.body || 'Drafting Armenian Sales Message...'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Thread Main Window */}
      <div className="flex-1 flex flex-col bg-slate-900/80 p-6">
        {activeConv ? (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {/* Thread Header */}
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{activeConv.company_name}</h2>
                <span className="text-xs text-slate-400">Target Industry: {activeConv.company_industry}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-medium">
                Channel: {activeConv.channel.toUpperCase()}
              </span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] p-2">
              {activeConv.messages?.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`p-5 rounded-2xl border max-w-2xl text-xs space-y-3 ${
                    msg.direction === 'outbound'
                      ? 'bg-blue-950/40 border-blue-800/80 ml-auto'
                      : 'bg-slate-800/90 border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span className="font-bold text-cyan-400 flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>{msg.sender}</span>
                    </span>
                    <span>{new Date(msg.sent_at).toLocaleTimeString()}</span>
                  </div>

                  <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-sm font-sans">{msg.body}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        msg.status === 'sent'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : msg.status === 'approved'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      STATUS: {msg.status.toUpperCase()}
                    </span>

                    {msg.status === 'pending_approval' && (
                      <button
                        onClick={() => handleApprove(msg.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                      >
                        Approve Armenian Message
                      </button>
                    )}

                    {msg.status === 'approved' && (
                      <button
                        onClick={() => handleSend(msg.id)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Prospect</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-slate-500 text-xs">
            Select a conversation thread on the left.
          </div>
        )}
      </div>
    </div>
  );
};
