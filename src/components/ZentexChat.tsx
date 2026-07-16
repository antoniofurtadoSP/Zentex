import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { Send, Hash, MessageSquare, Shield, Clock, Users, ArrowRightLeft, Volume2 } from 'lucide-react';

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

  // Auto-poll messages every 4 seconds to simulate real-time socket communication
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

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
      // Direct message between currentUser and activeChannel (employee)
      const isFromMeToActive = msg.senderId === currentUser.id && msg.receiverId === activeChannel;
      const isFromActiveToMe = msg.senderId === activeChannel && msg.receiverId === currentUser.id;
      return isFromMeToActive || isFromActiveToMe;
    }
  });

  // Count unread or list active participants
  const otherEmployees = users.filter(u => u.role === 'employee' && u.id !== currentUser.id);
  const otherAdmins = users.filter(u => u.role === 'admin' && u.id !== currentUser.id);

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
                        <img src={emp.avatar} alt={emp.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
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
                        <img src={adm.avatar} alt={adm.name} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        <Shield className="absolute -bottom-1 -right-1 w-3 h-3 text-emerald-600 fill-white" />
                      </div>
                      <span className="truncate">{adm.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Current User Quick Badge */}
        <div className="p-3 border-t border-slate-250 bg-slate-100/50 flex items-center gap-2.5">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{currentUser.role === 'admin' ? 'Gerente' : 'Técnico'}</p>
          </div>
        </div>
      </div>

      {/* Main Chat Board Area */}
      <div className="flex-1 flex flex-col justify-between bg-white">
        
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

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
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
                      src={users.find(u => u.id === msg.senderId)?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
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
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {msg.senderRole === 'admin' ? 'Gerente' : 'Técnico'}
                        </span>
                      </div>
                    )}

                    {/* Bubble Container */}
                    <div className={`p-3 rounded-2xl text-xs relative leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-emerald-650 text-white font-medium rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <div className="flex justify-between gap-4 items-start">
                        <p className="flex-1">{msg.text}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const speechText = `${msg.senderName} disse: ${msg.text}`;
                            if ((window as any).zentexSpeakForce) {
                              (window as any).zentexSpeakForce(speechText);
                            }
                          }}
                          className={`p-1 rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer ${
                            isMe ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Narrar mensagem"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
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
                {otherEmployees.map(e => <option key={e.id} value={e.id}>{e.name.split(' ')[0]}</option>)}
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
            className="p-2.5 bg-emerald-650 hover:bg-emerald-600 active:scale-95 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
