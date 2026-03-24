import { useState, FormEvent, useRef, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  ChevronLeft,
  Smile,
  Calendar,
  Info,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatsForUser, getMessages, sendMessage as dbSendMessage, markChatRead } from '../../lib/db';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabase';
import type { Chat, Message } from '../../types';

export default function AlumniChat() {
  const { profile: user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialChatId = searchParams.get('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const reloadChats = async () => {
    if (!user) return;
    const all = await getChatsForUser(user.id);
    setChats(all);
    return all;
  };

  const loadMessages = async (chatId: string) => {
    const msgs = await getMessages(chatId);
    setMessages(msgs);
  };

  useEffect(() => {
    if (!user) return;
    reloadChats().then(all => {
      if (all && all.length > 0) {
        if (initialChatId && all.some(c => c.id === initialChatId)) {
            setSelectedChatId(initialChatId);
            loadMessages(initialChatId);
        } else if (!selectedChatId) {
            setSelectedChatId(all[0].id);
            loadMessages(all[0].id);
        }
      }
    });
  }, [user, initialChatId]);

  // Realtime: subscribe to new messages in selected chat
  useEffect(() => {
    if (!selectedChatId) return;
    const channel = supabase
      .channel(`alumni-messages:${selectedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${selectedChatId}`,
      }, () => {
        loadMessages(selectedChatId);
      })
      .subscribe();
    loadMessages(selectedChatId);
    return () => { supabase.removeChannel(channel); };
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedChat = chats.find(c => c.id === selectedChatId) ?? null;

  const handleSelectChat = async (chatId: string) => {
    if (!user) return;
    await markChatRead(chatId, 'alumni');
    setSelectedChatId(chatId);
    setSearchParams({ chat: chatId });
    setIsMobileListVisible(false);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatId || !user) return;
    const text = message.trim();
    setMessage('');
    const sent = await dbSendMessage(selectedChatId, text, 'alumni', user.id);
    if (sent) loadMessages(selectedChatId);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface lg:pl-64">
      <Sidebar role="alumni" />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <aside className={`
          ${isMobileListVisible ? 'flex' : 'hidden'}
          w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:flex
        `}>
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold text-slate-900">Mentees Chat</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                {chats.length}
              </span>
            </div>
            <div className="relative mt-4">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search mentees..."
                className="w-full rounded-xl border-slate-100 bg-slate-50 py-2 pr-4 pl-10 text-xs focus:border-primary focus:bg-white focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            <div className="mb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Chats</div>
            {chats.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                No conversations yet. Your mentees will appear here once you accept their requests.
              </p>
            )}
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`
                  group mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all
                  ${selectedChatId === chat.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-50'}
                `}
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.studentAvatarUrl || `https://picsum.photos/seed/${chat.studentId}/100/100`}
                    alt={chat.studentName}
                    className={`h-11 w-11 rounded-full object-cover ring-2 ${selectedChatId === chat.id ? 'ring-white/20' : 'ring-transparent'}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-sm font-bold ${selectedChatId === chat.id ? 'text-white' : 'text-slate-900'}`}>
                      {chat.studentName}
                    </p>
                    <p className={`text-[10px] ${selectedChatId === chat.id ? 'text-primary-light' : 'text-slate-400'}`}>
                      {chat.lastTime}
                    </p>
                  </div>
                  <p className={`truncate text-xs ${selectedChatId === chat.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {chat.lastMessage || 'Start the conversation...'}
                  </p>
                </div>
                {chat.unreadByAlumni > 0 && selectedChatId !== chat.id && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {chat.unreadByAlumni}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <main className={`
          ${!isMobileListVisible || selectedChat ? 'flex' : 'hidden'}
          flex-1 flex-col bg-white lg:flex
        `}>
          {selectedChat ? (
            <>
              <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsMobileListVisible(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="relative">
                    <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100">
                      <img src={selectedChat.studentAvatarUrl || `https://picsum.photos/seed/${selectedChat.studentId}/100/100`} alt={selectedChat.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedChat.studentName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Student</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all sm:block"><Phone size={18} /></button>
                  <button className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all sm:block"><Video size={18} /></button>
                  <button onClick={() => setShowInfo(!showInfo)} className={`rounded-xl p-2 transition-all ${showInfo ? 'bg-primary/5 text-primary' : 'text-slate-400 hover:bg-slate-50'}`}><Info size={18} /></button>
                  <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all"><MoreVertical size={18} /></button>
                </div>
              </header>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex justify-center pt-10">
                      <p className="rounded-full bg-white px-4 py-2 text-xs text-slate-400 shadow-sm ring-1 ring-slate-200">
                        No messages yet — start the conversation! 👋
                      </p>
                    </div>
                  )}
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'alumni' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex max-w-[75%] items-end gap-2 ${msg.sender === 'alumni' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {msg.sender !== 'alumni' && (
                            <img src={selectedChat.studentAvatarUrl || `https://picsum.photos/seed/${selectedChat.studentId}/100/100`} className="h-6 w-6 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                          )}
                          <div className="flex flex-col gap-1">
                            <div className={`
                              rounded-2xl px-4 py-2.5 text-sm shadow-sm
                              ${msg.sender === 'alumni'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white text-slate-900 rounded-tl-none ring-1 ring-slate-200'}
                            `}>
                              <p className="leading-relaxed">{msg.text}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] ${msg.sender === 'alumni' ? 'justify-end text-slate-400' : 'text-slate-400'}`}>
                              {msg.time}
                              {msg.sender === 'alumni' && (
                                <CheckCheck size={12} className={msg.status === 'read' ? 'text-primary' : 'text-slate-300'} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                <AnimatePresence>
                  {showInfo && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="hidden flex-col border-l border-slate-100 bg-white lg:flex overflow-hidden"
                    >
                      <div className="p-6 text-center">
                        <div className="mx-auto h-20 w-20 overflow-hidden rounded-3xl ring-4 ring-slate-50">
                          <img src={selectedChat.studentAvatarUrl || `https://picsum.photos/seed/${selectedChat.studentId}/100/100`} alt={selectedChat.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">{selectedChat.studentName}</h3>
                        <p className="text-xs text-slate-400">Student Mentee</p>
                      </div>
                      <div className="px-6">
                        <div className="grid grid-cols-2 gap-2">
                          <button className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 p-3 text-slate-600 transition-all hover:bg-primary/5 hover:text-primary">
                            <Calendar size={18} />
                            <span className="text-[10px] font-bold">Schedule</span>
                          </button>
                          <button className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 p-3 text-slate-600 transition-all hover:bg-primary/5 hover:text-primary">
                            <Search size={18} />
                            <span className="text-[10px] font-bold">Search</span>
                          </button>
                        </div>
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>
              </div>

              <footer className="bg-white p-4 border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all"><Paperclip size={18} /></button>
                    <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all"><Smile size={18} /></button>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                  <Send size={28} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-500">Select a conversation</h3>
                <p className="text-sm text-slate-400">Choose a mentee to start chatting.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
