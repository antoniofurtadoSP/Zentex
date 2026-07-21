import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { getAvatarUrl } from '../utils';
import { Send, Hash, MessageSquare, Shield, Clock, Users, ArrowRightLeft, ArrowDown } from 'lucide-react';

interface ZentexChatProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  onSendMessage: (text: string, receiverId?: string) => void;
  onRefresh: () => void;
}

export default function ZentexChat({ currentUser, users, messages, onSendMessage, onRefresh }: ZentexChatProps) {
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'general' | string>('general'); // 'general' or employeeUserId
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesCountRef = useRef(messages.length);
  const prevActiveChannelRef = useRef(activeChannel);

  // Auto-poll messages every 4 seconds to simulate real-time socket communication
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const scrollToBottom = (smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // If the scroll is more than 180px away from the bottom, show the scroll button
    const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 180;
    setShowScrollButton(isScrolledUp);
  };

  // Smart scroll effect to prevent locking/freezing
  useEffect(() => {
    const container = scrollContainerRef.current;

    // 1. If we switched channels, scroll to bottom immediately (instant, no smooth scrolling)
    if (activeChannel !== prevActiveChannelRef.current) {
      scrollToBottom(false);
      prevActiveChannelRef.current = activeChannel;
      prevMessagesCountRef.current = messages.length;
      return;
    }

    // 2. If the message count increased, scroll to bottom if it's our own or if we are already at the bottom
    if (messages.length > prevMessagesCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      const isMyMessage = lastMessage?.senderId === currentUser.id;

      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isMyMessage || isNearBottom) {
          scrollToBottom(true);
        }
      } else {
        scrollToBottom(true);
      }
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages, activeChannel, currentUser.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const receiverId = activeChannel === 'general' ? undefined : activeChannel;
    onSendMessage(inputText.trim(), receiverId);
    setInputText('');
  };

  // Filter messages for current channel
  const filteredMessages = messages.filter(msg => {
    if (activeChannel === 'general') {
      return !msg.receiverId; // general channel has no receiverId
    } else {
      // Direct message between currentUser and activeChannel (employee OR client)
      const isFromMeToActive = msg.senderId === currentUser.id && msg.receiverId === activeChannel;
      const isFromActiveToMe = msg.senderId === activeChannel && msg.receiverId === currentUser.id;
      
      const activeUser = users.find(u => u.id === activeChannel);
      const isActiveClient = activeUser?.role === 'client';
      
      if (isActiveClient) {
        // Match client sending to any admin (e.g. admin1, admin2, or generic 'admin')
        const isFromClientToAdmins = msg.senderId === activeChannel && (msg.receiverId === currentUser.id || msg.receiverId === 'admin1' || msg.receiverId === 'admin2' || msg.receiverId === 'admin');
        // Match any admin sending to client
        const isFromAdminsToClient = (msg.senderRole === 'admin' || msg.senderId === 'admin1' || msg.senderId === 'admin2') && msg.receiverId === activeChannel;
        return isFromClientToAdmins || isFromAdminsToClient;
      }
      
      return isFromMeToActive || isFromActiveToMe;
    }
  });

  // Count unread or list active participants
  const otherEmployees = users.filter(u => u.role === 'employee' && u.id !== currentUser.id);
  const otherAdmins = users.filter(u => u.role === 'admin' && u.id !== currentUser.id);
  const clients = users.filter(u => u.role === 'client');

  return (
    <div className="w-full h-[500px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex">
      
      {/* Sidebar Channels List */}
      <div className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col justify-between hidden sm:flex">
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-6">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-2">Canais de Comunicação</h4>
            <button
              onClick={() => setActiveChannel('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeChannel === 'general'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Canal Geral</span>
            </button>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-2">
              {currentUser.role === 'admin' ? 'Conversas Privadas' : 'Administradores'}
            </h4>
            
            <div className="space-y-1">
              {currentUser.role === 'admin' ? (
                otherEmployees.map(emp => {
                  const isActive = activeChannel === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setActiveChannel(emp.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="relative">
                        <img src={getAvatarUrl(emp)} alt={emp.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                          emp.status === 'working' ? 'bg-emerald-500' : emp.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                      </div>
                      <span className="truncate">{emp.name}</span>
                    </button>
                  );
                })
              ) : (
                users.filter(u => u.role === 'admin').map(adm => {
                  const isActive = activeChannel === adm.id;
                  return (
                    <button
                      key={adm.id}
                      onClick={() => setActiveChannel(adm.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="relative">
                        <img src={getAvatarUrl(adm)} alt={adm.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        <Shield className="absolute -bottom-1 -right-1 w-3 h-3 text-emerald-600 fill-white" />
                      </div>
                      <span className="truncate">{adm.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {currentUser.role === 'admin' && clients.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-2">
                Atendimento ao Cliente
              </h4>
              <div className="space-y-1">
                {clients.map(cli => {
                  const isActive = activeChannel === cli.id;
                  const clientMsgs = messages.filter(m => m.senderId === cli.id || m.receiverId === cli.id);
                  const hasMessages = clientMsgs.length > 0;

                  return (
                    <button
                      key={cli.id}
                      onClick={() => setActiveChannel(cli.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-55 text-blue-700 border border-blue-100 bg-blue-50'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img src={getAvatarUrl(cli)} alt={cli.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                          <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                            cli.status === 'working' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                        </div>
                        <span className="truncate">{cli.name}</span>
                      </div>
                      {hasMessages && (
                        <span className="text-[8px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">
                          Ativo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current User Quick Badge */}
        <div className="p-3 border-t border-slate-250 bg-slate-100/50 flex items-center gap-2.5">
          <img src={getAvatarUrl(currentUser)} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{currentUser.role === 'admin' ? 'Gerente' : 'Técnico'}</p>
          </div>
        </div>
      </div>

      {/* Main Chat Board Area */}
      <div className="flex-1 flex flex-col justify-between bg-white min-w-0">
        
        {/* Chat Header */}
        <div className="px-5 py-3 border-b border-slate-150 bg-white/95 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              {activeChannel === 'general' ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 font-sans">
                {activeChannel === 'general' 
                  ? 'Canal Geral de Campo' 
                  : `Chat com ${users.find(u => u.id === activeChannel)?.name || 'Suporte'}`}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeChannel === 'general' 
                  ? 'Comunicação aberta para toda a equipe externa Zentex' 
                  : 'Canal de suporte operacional direto e sigiloso'}
              </p>
            </div>
          </div>

          <button 
            onClick={onRefresh}
            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors text-[10px] flex items-center gap-1 border border-slate-200 shadow-sm bg-white"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Sincronizado</span>
          </button>
        </div>

        {/* Message Stream Container */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50/30">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-5 space-y-4"
          >
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Sem histórico de mensagens</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                  {activeChannel === 'general'
                    ? 'Escreva uma mensagem geral para alertar toda a equipe externa.'
                    : 'Inicie uma conversa direta para alinhar detalhes de execução ou enviar feedback.'}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const msgDate = new Date(msg.timestamp);
                const formattedTime = msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <img
                        src={getAvatarUrl(users.find(u => u.id === msg.senderId))}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-1"
                      />
                    )}
                    
                    <div>
                      {/* Name Header */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-700">{msg.senderName}</span>
                          <span className={`text-[8px] uppercase tracking-wider px-1 py-0.5 rounded border ${
                            msg.senderRole === 'admin' 
                              ? 'bg-rose-50 text-rose-700 border-rose-100' 
                              : msg.senderRole === 'client'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {msg.senderRole === 'admin' ? 'Gerente' : msg.senderRole === 'client' ? 'Cliente' : 'Técnico'}
                          </span>
                        </div>
                      )}

                      {/* Bubble Container */}
                      <div className={`p-3 rounded-2xl text-xs relative leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-emerald-600 text-white font-medium rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Timestamp */}
                        <span className={`block text-[9px] mt-1.5 text-right ${
                          isMe ? 'text-white/80' : 'text-slate-400'
                        }`}>
                          {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-4 right-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 text-[10px] font-extrabold z-10 border border-emerald-400/20"
            >
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Ver novas mensagens</span>
            </button>
          )}
        </div>

        {/* Floating Switch Channel for Mobile View */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between sm:hidden">
          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
            Canal ativo: {activeChannel === 'general' ? 'Geral' : 'Privado'}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveChannel('general')}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                activeChannel === 'general' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Geral
            </button>
            {currentUser.role === 'admin' ? (
              <select
                value={activeChannel}
                onChange={(e) => setActiveChannel(e.target.value)}
                className="bg-white text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded-md border border-slate-200 focus:outline-none"
              >
                <option value="general">Geral</option>
                <optgroup label="Técnicos">
                  {otherEmployees.map(e => <option key={e.id} value={e.id}>{e.name.split(' ')[0]}</option>)}
                </optgroup>
                <optgroup label="Clientes">
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name.split(' ')[0]}</option>)}
                </optgroup>
              </select>
            ) : (
              <select
                value={activeChannel}
                onChange={(e) => setActiveChannel(e.target.value)}
                className="bg-white text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded-md border border-slate-200 focus:outline-none"
              >
                <option value="general">Geral</option>
                {users.filter(u => u.role === 'admin').map(a => <option key={a.id} value={a.id}>{a.name.split(' ')[0]}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Input Panel */}
        <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Responder para ${activeChannel === 'general' ? 'Canal Geral' : 'Privado'}...`}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
