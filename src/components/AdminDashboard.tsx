import React, { useState, useEffect } from 'react';
import { User, ServiceOrder, TimeCard, ChatMessage, OSPriority } from '../types';
import { getAvatarUrl, isValidCPF, compressImageFile } from '../utils';
import ZentexMap from './ZentexMap';
import ZentexChat from './ZentexChat';
import { 
  Plus, Users, ClipboardList, Map, MessageSquare, Clock, ShieldCheck, 
  TrendingUp, CheckCircle, AlertTriangle, Play, HelpCircle, Phone, 
  MapPin, Eye, Calendar, UserPlus, RefreshCcw, Download, Upload, Image, X, Trash2,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  orders: ServiceOrder[];
  timecards: TimeCard[];
  messages: ChatMessage[];
  onCreateOrder: (order: Partial<ServiceOrder>) => void;
  onUpdateOrderStatus: (id: string, status: any, data?: any) => void;
  onDeleteOrder?: (id: string) => void;
  onRegisterUser: (user: Partial<User>) => void;
  onDeleteUser?: (id: string) => void;
  onSendMessage: (text: string, receiverId?: string) => void;
  onRefreshData: () => void;
  onResetDB: () => void;
}

export default function AdminDashboard({
  currentUser,
  users,
  orders,
  timecards,
  messages,
  onCreateOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onRegisterUser,
  onDeleteUser,
  onSendMessage,
  onRefreshData,
  onResetDB
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'employees' | 'map' | 'chat' | 'timecards'>('overview');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee' | 'client'>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [lastViewedChatTime, setLastViewedChatTime] = useState<string>(() => {
    return localStorage.getItem('lastViewedChatTime') || new Date().toISOString();
  });

  useEffect(() => {
    if (activeTab === 'chat') {
      const now = new Date().toISOString();
      setLastViewedChatTime(now);
      localStorage.setItem('lastViewedChatTime', now);
    }
  }, [activeTab, messages]);
  
  // Modals / Form States
  const [showOSModal, setShowOSModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  // OS Form state
  const [osTitle, setOsTitle] = useState('');
  const [osDescription, setOsDescription] = useState('');
  const [osClientName, setOsClientName] = useState('');
  const [osClientAddress, setOsClientAddress] = useState('');
  const [osClientPhone, setOsClientPhone] = useState('');
  const [osPriority, setOsPriority] = useState<OSPriority>('media');
  const [osAssignedEmployeeId, setOsAssignedEmployeeId] = useState('');

  // Employee Form state
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empAvatar, setEmpAvatar] = useState('');
  const [empPassword, setEmpPassword] = useState('123456');
  const [empAddress, setEmpAddress] = useState('');
  const [empDocumentId, setEmpDocumentId] = useState('');
  const [empBirthDate, setEmpBirthDate] = useState('');
  const [empAdmissionDate, setEmpAdmissionDate] = useState('');
  const [empNotes, setEmpNotes] = useState('');
  const [empRole, setEmpRole] = useState<'admin' | 'employee' | 'client'>('employee');
  const [empGender, setEmpGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas arquivos de imagem.');
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file, 300, 300, 0.8);
      setEmpAvatar(compressedBase64);
    } catch {
      alert('Erro ao processar imagem.');
    }
  };

  // Map tracking helper
  const [mapSelectedUser, setMapSelectedUser] = useState<User | null>(null);

  const handleCreateOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osTitle || !osClientName || !osClientAddress) {
      alert('Por favor, preencha os campos obrigatórios (Título, Cliente e Endereço).');
      return;
    }

    onCreateOrder({
      title: osTitle,
      description: osDescription,
      clientName: osClientName,
      clientAddress: osClientAddress,
      clientPhone: osClientPhone,
      priority: osPriority,
      assignedEmployeeId: osAssignedEmployeeId || undefined,
      createdBy: currentUser.id
    });

    // Reset Form
    setOsTitle('');
    setOsDescription('');
    setOsClientName('');
    setOsClientAddress('');
    setOsClientPhone('');
    setOsPriority('media');
    setOsAssignedEmployeeId('');
    setShowOSModal(false);
  };

  const handleRegisterEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      alert('Por favor, preencha o Nome e o E-mail.');
      return;
    }

    onRegisterUser({
      id: editingUser ? editingUser.id : undefined,
      name: empName,
      email: empEmail,
      phone: empPhone,
      avatar: empAvatar || undefined,
      role: empRole,
      gender: empGender,
      password: empPassword,
      isTemporaryPassword: editingUser ? editingUser.isTemporaryPassword : true,
      address: empAddress,
      documentId: empDocumentId,
      birthDate: empBirthDate,
      admissionDate: empAdmissionDate,
      notes: empNotes
    });

    // Reset Form and close modal
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpAvatar('');
    setEmpPassword('123456');
    setEmpAddress('');
    setEmpDocumentId('');
    setEmpBirthDate('');
    setEmpAdmissionDate('');
    setEmpNotes('');
    setEmpRole('employee');
    setEmpGender('neutral');
    setEditingUser(null);
    setShowEmployeeModal(false);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEmpName(user.name || '');
    setEmpEmail(user.email || '');
    setEmpPhone(user.phone || '');
    setEmpAvatar(user.avatar || '');
    setEmpGender(user.gender || 'neutral');
    setEmpPassword(user.password || '123456');
    setEmpAddress(user.address || '');
    setEmpDocumentId(user.documentId || '');
    setEmpBirthDate(user.birthDate || '');
    setEmpAdmissionDate(user.admissionDate || '');
    setEmpNotes(user.notes || '');
    setEmpRole(user.role || 'employee');
    setShowEmployeeModal(true);
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpAvatar('');
    setEmpGender('neutral');
    setEmpPassword('123456');
    setEmpAddress('');
    setEmpDocumentId('');
    setEmpBirthDate('');
    setEmpAdmissionDate('');
    setEmpNotes('');
    setEmpRole('employee');
    setShowEmployeeModal(true);
  };

  // Summary Math
  const activeOrders = orders.filter(o => o.status === 'em_andamento').length;
  const pendingOrders = orders.filter(o => o.status === 'aberta').length;
  const completedOrders = orders.filter(o => o.status === 'concluida').length;
  const pausedOrders = orders.filter(o => o.status === 'pausada').length;
  
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const workingEmployees = users.filter(u => u.role === 'employee' && u.status === 'working').length;
  const idleEmployees = users.filter(u => u.role === 'employee' && u.status === 'idle').length;
  const offlineEmployees = users.filter(u => u.role === 'employee' && u.status === 'offline').length;
  const totalClients = users.filter(u => u.role === 'client').length;

  const unreadClientMessages = messages.filter(m => 
    m.senderRole === 'client' && 
    m.timestamp > lastViewedChatTime
  );
  const unreadClientCount = unreadClientMessages.length;

  // Real-time corporate billing calculations
  const totalBilling = orders
    .filter(o => o.paymentStatus === 'pago')
    .reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div className="space-y-6">
      
      {unreadClientCount > 0 && activeTab !== 'chat' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-150 border-l-4 border-l-blue-600 p-4 rounded-xl shadow-3d-sm flex items-center justify-between animate-bounce [animation-duration:3s]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">Nova mensagem de cliente recebida!</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Você tem <strong className="text-blue-700 font-extrabold">{unreadClientCount}</strong> {unreadClientCount === 1 ? 'nova mensagem' : 'novas mensagens'} de {unreadClientCount === 1 ? 'cliente' : 'clientes'} aguardando atendimento.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('chat')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shadow-3d-btn-blue hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Atender Agora
          </button>
        </div>
      )}
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 - Ordens Ativas */}
        <button
          onClick={() => setActiveTab('orders')}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-indigo-500/60 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-indigo-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ir para Ordens de Serviço"
        >
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white rounded-xl shadow-3d-sm border border-indigo-100/30 transition-colors shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">Ordens Ativas</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-900">{activeOrders}</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">+{pendingOrders} abertas</span>
            </div>
          </div>
        </button>

        {/* Metric 2 - Técnicos em Campo */}
        <button
          onClick={() => {
            setActiveTab('employees');
            setRoleFilter('employee');
          }}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-emerald-600/60 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-emerald-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ver Equipe de Técnicos"
        >
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white rounded-xl shadow-3d-sm border border-emerald-100/30 transition-colors shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">Técnicos em Campo</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-900">{workingEmployees + idleEmployees}</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">/{totalEmployees} cad.</span>
            </div>
          </div>
        </button>

        {/* Metric 3 - OS Concluídas */}
        <button
          onClick={() => setActiveTab('orders')}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-teal-500/60 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-teal-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ir para Ordens de Serviço"
        >
          <div className="p-2.5 sm:p-3 bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white rounded-xl shadow-3d-sm border border-teal-100/30 transition-colors shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">OS Concluídas</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-900">{completedOrders}</span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">Este mês</span>
            </div>
          </div>
        </button>

        {/* Metric 4 - Pontos Batidos */}
        <button
          onClick={() => setActiveTab('timecards')}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-amber-500/60 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-amber-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ir para Registros de Ponto"
        >
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white rounded-xl shadow-3d-sm border border-amber-100/30 transition-colors shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">Pontos Batidos</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-900">{timecards.length}</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold">Hoje</span>
            </div>
          </div>
        </button>

        {/* Metric 5 - Financial Billing */}
        <button
          onClick={() => setActiveTab('orders')}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-emerald-500 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-emerald-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ir para Faturamento e Ordens"
        >
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white rounded-xl shadow-3d-sm border border-emerald-100/30 transition-colors shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">Faturamento Líquido</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono truncate">
                R$ {totalBilling.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full font-mono">PAID</span>
            </div>
          </div>
        </button>

        {/* Metric 6 - Clientes */}
        <button
          onClick={() => {
            setActiveTab('employees');
            setRoleFilter('client');
          }}
          className="text-left bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-b-4 border-b-blue-500/60 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-3d-md hover:scale-[1.02] hover:border-blue-300 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Clique para ver Lista de Clientes"
        >
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white rounded-xl shadow-3d-sm border border-blue-100/30 transition-colors shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">Clientes</p>
            <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-900">{totalClients}</span>
              <span className="text-[10px] text-blue-600 font-mono font-bold">cadastrados</span>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {([
            { id: 'overview', label: 'Visão Geral', icon: ShieldCheck },
            { id: 'orders', label: 'Ordens de Serviço (OS)', icon: ClipboardList },
            { id: 'employees', label: 'Funcionários (Equipe)', icon: Users },
            { id: 'map', label: 'Mapa de Equipes', icon: Map },
            { id: 'chat', label: 'Atendimento & Chat', icon: MessageSquare },
            { id: 'timecards', label: 'Registros de Ponto', icon: Clock }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer relative ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-3d-btn-emerald active:translate-y-0.5'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-3d-sm active-press'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-4 h-4" />
                {tab.id === 'chat' && unreadClientCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {tab.id === 'chat' && unreadClientCount > 0 && (
                <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full leading-none shadow-sm animate-pulse ml-0.5">
                  {unreadClientCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-3d-sm hover:shadow-3d-md hover:border-slate-350 active-press transition-all cursor-pointer"
            title="Sincronizar Dados"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          {confirmReset ? (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-xl animate-pulse shadow-sm">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-tight px-1.5">Resetar tudo?</span>
              <button
                onClick={() => {
                  onResetDB();
                  setConfirmReset(false);
                }}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all active:translate-y-0.5 shadow-3d-btn-rose cursor-pointer whitespace-nowrap"
                title="Confirmar restauração de dados para o padrão de testes"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all active-press shadow-3d-btn-slate cursor-pointer whitespace-nowrap"
                title="Cancelar"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold shadow-3d-sm hover:shadow-3d-md hover:border-rose-200/50 active-press transition-all cursor-pointer"
              title="Restaurar Banco de Dados ao estado padrão de testes"
            >
              Restaurar Seeds
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="transition-all duration-300">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Map Widget */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Visão Geral do Mapa</h3>
                    <p className="text-xs text-slate-500">Última localização sincronizada dos técnicos ativos</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Ver em tela cheia</span>
                    <Plus className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
                
                {/* Embedded Mini map */}
                <div className="w-full h-[230px] rounded-xl overflow-hidden border border-slate-200">
                  <ZentexMap 
                    users={users} 
                    orders={orders} 
                    selectedUser={mapSelectedUser} 
                    onSelectUser={(u) => {
                      setMapSelectedUser(u);
                      setActiveTab('map');
                    }}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Status / Operations List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-[360px] shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Status da Equipe</h3>
                <p className="text-xs text-slate-500">Monitoramento em tempo real de jornada</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                {users.filter(u => u.role === 'employee').map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={getAvatarUrl(emp)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                          emp.status === 'working' ? 'bg-emerald-500' : emp.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                        <p className="text-[10px] text-slate-500">{emp.phone || 'Sem telefone'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'working' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : emp.status === 'idle' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.status === 'working' ? 'Em OS' : emp.status === 'idle' ? 'Disponível' : 'Offline'}
                      </span>
                      {emp.lastLocationUpdate && (
                        <p className="text-[8px] text-slate-500 font-mono mt-1">GPS: {new Date(emp.lastLocationUpdate).toLocaleTimeString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recentes Ordens de Serviço */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Últimas Atividades Operacionais</h3>
                  <p className="text-xs text-slate-500">Histórico recente de ordens de serviço geradas</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setShowOSModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova OS</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                      <th className="p-3">Código</th>
                      <th className="p-3">Serviço/Cliente</th>
                      <th className="p-3">Prioridade</th>
                      <th className="p-3">Técnico Designado</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-500">{order.id}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{order.title}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{order.clientName}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.priority === 'alta' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : order.priority === 'media' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {order.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          {order.assignedEmployeeName ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-medium">{order.assignedEmployeeName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Não designado</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            order.status === 'em_andamento'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                              : order.status === 'pausada'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : order.status === 'concluida'
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {order.status === 'em_andamento' ? 'Executando' 
                             : order.status === 'pausada' ? 'Pausada'
                             : order.status === 'concluida' ? 'Concluída' 
                             : 'Aberta'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOS(order);
                                setActiveTab('orders');
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {onDeleteOrder && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Tem certeza que deseja excluir a Ordem de Serviço ${order.id}?`)) {
                                    onDeleteOrder(order.id);
                                    if (selectedOS?.id === order.id) {
                                      setSelectedOS(null);
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors border border-rose-100"
                                title="Excluir OS"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE ORDERS */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: List of OS */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">Ordens de Serviço Ativas</h3>
                  <p className="text-xs text-slate-500">Crie, gerencie e atribua tarefas de campo</p>
                </div>
                <button
                  onClick={() => setShowOSModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar OS</span>
                </button>
              </div>

              <div className="space-y-3">
                {orders.map(order => {
                  const isSelected = selectedOS?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOS(order)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-500/65 shadow-sm'
                          : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-slate-500">{order.id}</span>
                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded border ${
                              order.priority === 'alta' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : order.priority === 'media'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {order.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">{order.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{order.clientAddress}</span>
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            order.status === 'em_andamento'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.status === 'pausada'
                                ? 'bg-amber-50 text-amber-700'
                                : order.status === 'concluida'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {order.status === 'em_andamento' ? 'Executando' 
                             : order.status === 'pausada' ? 'Pausada'
                             : order.status === 'concluida' ? 'Concluída' 
                             : 'Aberta'}
                          </span>
                          {onDeleteOrder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Tem certeza que deseja excluir a Ordem de Serviço ${order.id}?`)) {
                                  onDeleteOrder(order.id);
                                  if (selectedOS?.id === order.id) {
                                    setSelectedOS(null);
                                  }
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Excluir OS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2 text-[10px] text-slate-500">
                        <span>Cliente: <strong>{order.clientName}</strong></span>
                        <div className="flex items-center gap-1.5">
                          {order.price ? (
                            <span className="font-mono text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60" title={`Pago via ${order.paymentMethod?.toUpperCase() || 'Cartão'}`}>
                              R$ {order.price.toFixed(2).replace('.', ',')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Atribuído a: <strong>{order.assignedEmployeeName || 'Sem designação'}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Detailed View */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {selectedOS ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Código {selectedOS.id}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{selectedOS.title}</h3>
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedOS.priority === 'alta' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {selectedOS.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3.5 border-y border-slate-100 py-4 text-xs">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Descrição do Chamado</h5>
                      <p className="text-slate-600 mt-1.5 leading-relaxed">{selectedOS.description || 'Nenhuma descrição fornecida.'}</p>
                    </div>

                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Cliente</h5>
                      <p className="text-slate-800 mt-1 font-semibold">{selectedOS.clientName}</p>
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedOS.clientAddress}</span>
                      </p>
                      {selectedOS.clientPhone && (
                        <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedOS.clientPhone}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Status Operacional</h5>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          selectedOS.status === 'em_andamento' ? 'bg-emerald-500 animate-pulse' : selectedOS.status === 'pausada' ? 'bg-amber-400' : selectedOS.status === 'concluida' ? 'bg-slate-400' : 'bg-indigo-500'
                        }`} />
                        <span className="text-slate-800 font-semibold capitalize">
                          {selectedOS.status === 'em_andamento' ? 'Em Execução' : selectedOS.status === 'concluida' ? 'Finalizada' : selectedOS.status === 'pausada' ? 'Pausada' : 'Aberta (Aguardando)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Técnico Designado</h5>
                      <p className="text-slate-800 mt-1.5 font-medium flex items-center gap-2">
                        {selectedOS.assignedEmployeeName ? (
                          <>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{selectedOS.assignedEmployeeName}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Nenhum técnico associado</span>
                        )}
                      </p>
                    </div>

                    {/* Completion Data (notes & signatures) */}
                    {selectedOS.status === 'concluida' && (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5 mt-2">
                        <h6 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Relatório de Fechamento</span>
                        </h6>
                        {selectedOS.completedAt && (
                          <p className="text-[10px] text-slate-500">
                            Finalizada em: {new Date(selectedOS.completedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Anotações do Técnico:</p>
                          <p className="text-slate-600 italic mt-0.5">{selectedOS.completionNotes || 'Nenhuma anotação.'}</p>
                        </div>
                        {selectedOS.completionSignature && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold">Assinatura Digital:</p>
                            <div className="bg-white border border-slate-200 p-2 rounded-lg mt-1 flex items-center justify-center font-mono text-[10px] text-slate-500 shadow-inner">
                              {selectedOS.completionSignature.startsWith('data:image') ? (
                                <img 
                                  src={selectedOS.completionSignature} 
                                  alt="Assinatura" 
                                  className="h-12 object-contain opacity-85" 
                                />
                              ) : (
                                <span>{selectedOS.completionSignature}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pause Info */}
                    {selectedOS.status === 'pausada' && selectedOS.pauseReason && (
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-700">
                        <p className="text-[10px] font-bold uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Motivo da Pausa</span>
                        </p>
                        <p className="mt-1 font-medium italic">{selectedOS.pauseReason}</p>
                      </div>
                    )}

                    {/* Billing & Financial Tracking Block */}
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-3 space-y-2.5">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações de Cobrança</h5>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px] leading-none">Status de Pagamento</span>
                          <span className={`inline-block font-black uppercase mt-1 ${selectedOS.price ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {selectedOS.price ? '● Pago & Liquidado' : '● Cortesia / Pendente'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase font-bold text-[8px] leading-none">Valor Cobrado</span>
                          <span className="font-extrabold text-slate-800 mt-1 block font-mono">
                            {selectedOS.price ? `R$ ${selectedOS.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                          </span>
                        </div>
                        {selectedOS.price && (
                          <>
                            <div>
                              <span className="text-slate-400 block uppercase font-bold text-[8px] leading-none">Método</span>
                              <span className="font-bold text-slate-700 mt-1 block uppercase">
                                {selectedOS.paymentMethod === 'pix' ? 'Pix Instantâneo' : `Cartão (${selectedOS.paymentMethod === 'credit' ? 'Crédito' : 'Débito'})`}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase font-bold text-[8px] leading-none">Data do Pagamento</span>
                              <span className="font-mono text-slate-600 mt-1 block">
                                {selectedOS.paymentDate 
                                  ? new Date(selectedOS.paymentDate).toLocaleString('pt-BR') 
                                  : new Date(selectedOS.createdAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete OS Action */}
                    {onDeleteOrder && (
                      <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem certeza que deseja excluir a Ordem de Serviço ${selectedOS.id}?`)) {
                              onDeleteOrder(selectedOS.id);
                              setSelectedOS(null);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir Ordem de Serviço</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400">
                  <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-xs font-bold">Nenhuma OS Selecionada</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Selecione uma ordem de serviço ao lado para ver o detalhamento completo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EMPLOYEES */}
        {activeTab === 'employees' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Equipe de Funcionários & Administradores</h3>
                <p className="text-xs text-slate-500">Cadastre, atualize dados cadastrais, endereço, fotos, e visualize a ficha completa dos colaboradores</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filters */}
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/50">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      roleFilter === 'all'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setRoleFilter('employee')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      roleFilter === 'employee'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Técnicos
                  </button>
                  <button
                    onClick={() => setRoleFilter('admin')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      roleFilter === 'admin'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Administradores
                  </button>
                  <button
                    onClick={() => setRoleFilter('client')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      roleFilter === 'client'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Clientes
                  </button>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Colaborador</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
                .map(emp => {
                  const empActiveOrdersCount = orders.filter(o => o.assignedEmployeeId === emp.id && o.status === 'em_andamento').length;
                  const isSelf = emp.id === currentUser.id;
                  return (
                    <div key={emp.id} className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img src={getAvatarUrl(emp)} alt={emp.name} className="w-11 h-11 rounded-full object-cover border border-white shadow-sm" />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              emp.status === 'working' ? 'bg-emerald-500' : emp.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-slate-800 truncate max-w-[130px]">{emp.name}</h4>
                              {emp.role === 'admin' ? (
                                <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-bold whitespace-nowrap">Admin</span>
                              ) : emp.role === 'client' ? (
                                <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold whitespace-nowrap">Cliente</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold whitespace-nowrap">Técnico</span>
                              )}
                              {emp.isTemporaryPassword && (
                                <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold whitespace-nowrap animate-pulse">Provisória</span>
                              )}
                              {isSelf && (
                                <span className="text-[8px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 font-bold whitespace-nowrap">Você</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{emp.email}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{emp.phone || 'Sem telefone'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditUser(emp)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-all cursor-pointer"
                            title="Editar Dados Cadastrais"
                          >
                            <Image className="w-4 h-4" />
                          </button>

                          {onDeleteUser && !isSelf && (
                            <div className="flex-shrink-0">
                              {deletingUserId === emp.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-xl animate-pulse shadow-sm">
                                  <button
                                    onClick={() => {
                                      onDeleteUser(emp.id);
                                      setDeletingUserId(null);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-extrabold px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                    title="Confirmar exclusão"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setDeletingUserId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-extrabold px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                    title="Não"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingUserId(emp.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                                  title="Excluir Colaborador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Ficha Funcional</span>
                          <button
                            onClick={() => setViewingUser(emp)}
                            className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Ficha Completa</span>
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 block">Status de Atividade</span>
                          <span className={`font-bold uppercase tracking-wider block ${
                            emp.status === 'working' ? 'text-emerald-600' : emp.status === 'idle' ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {emp.status === 'working' ? `Ativo (${empActiveOrdersCount} OS)` : emp.status === 'idle' ? 'Disponível' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: MAPS */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Localização em Tempo Real (Zentex Radar)</h3>
                <p className="text-xs text-slate-500">Monitoramento dos funcionários em tempo real de atividade</p>
              </div>
              {mapSelectedUser && (
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                  <span className="text-[10px] text-slate-600">Seguindo: <strong>{mapSelectedUser.name}</strong></span>
                  <button 
                    onClick={() => setMapSelectedUser(null)}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold ml-1.5"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            <ZentexMap 
              users={users} 
              orders={orders} 
              selectedUser={mapSelectedUser} 
              onSelectUser={(u) => setMapSelectedUser(u)} 
            />
          </div>
        )}

        {/* TAB 5: CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Central de Atendimento & Chat</h3>
              <p className="text-xs text-slate-500">Atendimento ao cliente em tempo real e comunicação corporativa com a equipe em campo</p>
            </div>

            <ZentexChat
              currentUser={currentUser}
              users={users}
              messages={messages}
              onSendMessage={onSendMessage}
              onRefresh={onRefreshData}
            />
          </div>
        )}

        {/* TAB 6: TIMECARDS (REGISTRO DE PONTO) */}
        {activeTab === 'timecards' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Folha de Ponto Diária (Equipe Externa)</h3>
                <p className="text-xs text-slate-500">Histórico de horários de entrada e saída registrados com satélite</p>
              </div>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-2 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Relatório</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {timecards.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <span>Nenhum registro de ponto computado hoje.</span>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50">
                      <th className="p-3">Funcionário</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Entrada (Clock In)</th>
                      <th className="p-3">Saída (Clock Out)</th>
                      <th className="p-3">GPS Entrada</th>
                      <th className="p-3">GPS Saída</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timecards.map(tc => (
                      <tr key={tc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{tc.employeeName}</td>
                        <td className="p-3 text-slate-500 font-mono">{tc.date}</td>
                        <td className="p-3 text-emerald-600 font-mono font-semibold">{tc.clockIn}</td>
                        <td className="p-3 font-mono">
                          {tc.clockOut ? (
                            <span className="text-rose-600 font-semibold">{tc.clockOut}</span>
                          ) : (
                            <span className="text-slate-400 italic">No expediente</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-550 font-mono text-[10px]">
                          {tc.latitudeIn ? (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {tc.latitudeIn.toFixed(4)}, {tc.longitudeIn?.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sem GPS</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-550 font-mono text-[10px]">
                          {tc.clockOut && tc.latitudeOut ? (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {tc.latitudeOut.toFixed(4)}, {tc.longitudeOut?.toFixed(4)}
                            </span>
                          ) : tc.clockOut ? (
                            <span className="text-slate-400 italic">Sem GPS</span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE OS */}
      {showOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span>Nova Ordem de Serviço</span>
              </h3>
              <button 
                onClick={() => setShowOSModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateOSSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="adminOsTitle" className="text-[10px] font-bold text-slate-500 uppercase">Título da OS *</label>
                  <input
                    id="adminOsTitle"
                    name="adminOsTitle"
                    type="text"
                    required
                    placeholder="Ex: Manutenção Preventiva do Ar Condicionado"
                    value={osTitle}
                    onChange={(e) => setOsTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="adminOsDescription" className="text-[10px] font-bold text-slate-500 uppercase">Descrição da OS</label>
                  <textarea
                    id="adminOsDescription"
                    name="adminOsDescription"
                    rows={2}
                    placeholder="Descreva as tarefas e o problema relatado..."
                    value={osDescription}
                    onChange={(e) => setOsDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="adminOsClientName" className="text-[10px] font-bold text-slate-500 uppercase">Cliente *</label>
                  <input
                    id="adminOsClientName"
                    name="adminOsClientName"
                    type="text"
                    required
                    placeholder="Ex: Banco Itaú Paulista"
                    value={osClientName}
                    onChange={(e) => setOsClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="adminOsClientPhone" className="text-[10px] font-bold text-slate-500 uppercase">Telefone do Cliente</label>
                  <input
                    id="adminOsClientPhone"
                    name="adminOsClientPhone"
                    type="text"
                    autoComplete="tel"
                    placeholder="Ex: (11) 98888-7777"
                    value={osClientPhone}
                    onChange={(e) => setOsClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="adminOsClientAddress" className="text-[10px] font-bold text-slate-500 uppercase">Endereço do Chamado *</label>
                  <input
                    id="adminOsClientAddress"
                    name="adminOsClientAddress"
                    type="text"
                    required
                    autoComplete="street-address"
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                    value={osClientAddress}
                    onChange={(e) => setOsClientAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prioridade</label>
                  <select
                    value={osPriority}
                    onChange={(e) => setOsPriority(e.target.value as OSPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Técnico Designado</label>
                  <select
                    value={osAssignedEmployeeId}
                    onChange={(e) => setOsAssignedEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Não Designar Agora --</option>
                    {users.filter(u => u.role === 'employee').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md"
                >
                  Cadastrar Ordem
                </button>
                <button
                  type="button"
                  onClick={() => setShowOSModal(false)}
                  className="px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER/EDIT EMPLOYEE */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>{editingUser ? 'Atualizar Ficha Cadastral' : empRole === 'client' ? 'Cadastrar Novo Cliente' : 'Cadastrar Novo Colaborador'}</span>
              </h3>
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleRegisterEmployeeSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="empNameInput" className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
                  <input
                    id="empNameInput"
                    name="empName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Ex: João Ferreira da Silva"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="empRoleSelect" className="text-[10px] font-bold text-slate-500 uppercase">Cargo / Função *</label>
                  <select
                    id="empRoleSelect"
                    name="empRole"
                    required
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as 'admin' | 'employee' | 'client')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="employee">Técnico de Campo</option>
                    <option value="admin">Gerente / Administrador</option>
                    <option value="client">Cliente</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="empGenderSelect" className="text-[10px] font-bold text-slate-500 uppercase">Gênero *</label>
                  <select
                    id="empGenderSelect"
                    name="empGender"
                    required
                    value={empGender}
                    onChange={(e) => {
                      const newGender = e.target.value as 'male' | 'female' | 'neutral';
                      setEmpGender(newGender);
                      
                      const isDefault = !empAvatar || 
                        empAvatar.includes('1535713875002-d1d0cf377fde') || 
                        empAvatar.includes('1494790108377-be9c29b29330') || 
                        empAvatar.includes('1507003211169-0a1dd7228f2d') ||
                        empAvatar.includes('1500648767791-00dcc994a43e') ||
                        empAvatar.includes('1534528741775-53994a69daeb');
                        
                      if (isDefault) {
                        if (newGender === 'female') {
                          setEmpAvatar('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
                        } else if (newGender === 'neutral') {
                          setEmpAvatar('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
                        } else {
                          setEmpAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="neutral">Neutro / Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="empEmailInput" className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Acesso *</label>
                  <input
                    id="empEmailInput"
                    name="empEmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Ex: joao@zentex.com"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="empPhoneInput" className="text-[10px] font-bold text-slate-500 uppercase">Celular / WhatsApp</label>
                  <input
                    id="empPhoneInput"
                    name="empPhone"
                    type="text"
                    autoComplete="tel"
                    placeholder="Ex: (11) 99999-8888"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="empDocumentInput" className="text-[10px] font-bold text-slate-500 uppercase">CPF ou RG</label>
                    {empDocumentId && empDocumentId.replace(/\D/g, '').length === 11 && (
                      <span className={`text-[9px] font-bold ${isValidCPF(empDocumentId) ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isValidCPF(empDocumentId) ? '✓ CPF Válido' : '⚠ CPF Inválido'}
                      </span>
                    )}
                  </div>
                  <input
                    id="empDocumentInput"
                    name="empDocument"
                    type="text"
                    autoComplete="off"
                    placeholder="Ex: 123.456.789-00"
                    value={empDocumentId}
                    onChange={(e) => setEmpDocumentId(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:bg-white transition-all ${
                      empDocumentId && empDocumentId.replace(/\D/g, '').length === 11
                        ? isValidCPF(empDocumentId)
                          ? 'border-emerald-400 focus:border-emerald-500'
                          : 'border-rose-300 focus:border-rose-500'
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="empBirthDateInput" className="text-[10px] font-bold text-slate-500 uppercase">Data de Nascimento</label>
                  <input
                    id="empBirthDateInput"
                    name="empBirthDate"
                    type="date"
                    value={empBirthDate}
                    onChange={(e) => setEmpBirthDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="empAdmissionDateInput" className="text-[10px] font-bold text-slate-500 uppercase">Data de Admissão</label>
                  <input
                    id="empAdmissionDateInput"
                    name="empAdmissionDate"
                    type="date"
                    value={empAdmissionDate}
                    onChange={(e) => setEmpAdmissionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="empPasswordInput" className="text-[10px] font-bold text-slate-500 uppercase">{editingUser ? 'Senha de Acesso' : 'Senha Provisória *'}</label>
                  <input
                    id="empPasswordInput"
                    name="empPassword"
                    type="text"
                    required
                    autoComplete="new-password"
                    placeholder="Ex: 123456"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="empAddressInput" className="text-[10px] font-bold text-slate-500 uppercase">Endereço Residencial</label>
                  <input
                    id="empAddressInput"
                    name="empAddress"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    value={empAddress}
                    onChange={(e) => setEmpAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Observações Internas (Ficha)</label>
                  <textarea
                    rows={2}
                    placeholder="Anotações de RH, histórico ou observações sobre o colaborador..."
                    value={empNotes}
                    onChange={(e) => setEmpNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Foto do Perfil</label>
                
                {empAvatar ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                    <img 
                      src={empAvatar} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full object-cover border border-white shadow-md bg-slate-200 animate-fade-in" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">Imagem de perfil selecionada</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {empAvatar.startsWith('data:image') ? 'Arquivo enviado via upload' : empAvatar}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEmpAvatar('')}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold mt-1 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Remover foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-50/30' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="emp-avatar-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="emp-avatar-upload" className="cursor-pointer block space-y-1.5">
                      <div className="mx-auto w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-emerald-600 hover:text-emerald-500">Clique para enviar</span> ou arraste uma foto aqui
                      </div>
                      <p className="text-[9px] text-slate-400">PNG, JPG, GIF até 5MB</p>
                    </label>
                  </div>
                )}
                
                {/* Fallback to URL */}
                <div className="pt-1">
                  <details className="text-slate-500 group">
                    <summary className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer list-none flex items-center gap-1">
                      <span className="transition-transform group-open:rotate-90">▶</span>
                      <span>Ou cole um link de imagem (URL)</span>
                    </summary>
                    <div className="mt-2 pl-3">
                      <input
                        type="text"
                        placeholder="Ex: https://images.unsplash.com/photo-..."
                        value={empAvatar.startsWith('data:image') ? '' : empAvatar}
                        onChange={(e) => setEmpAvatar(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </details>
                </div>
              </div>

              {!editingUser && (
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">Esta senha provisória deverá ser alterada pelo funcionário em seu primeiro acesso.</p>
              )}

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW EMPLOYEE PROFILE CARD ("FICHA COMPLETA") */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Header banner */}
            <div className="h-24 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 relative">
              <button 
                onClick={() => setViewingUser(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all text-xs font-bold"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar & Quick info */}
            <div className="px-6 pb-4 relative border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:mb-1">
                <img 
                  src={getAvatarUrl(viewingUser)} 
                  alt={viewingUser.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg bg-white relative z-10" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 leading-tight truncate">{viewingUser.name}</h3>
                    {viewingUser.role === 'admin' ? (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold uppercase tracking-wider">Administrador</span>
                    ) : viewingUser.role === 'client' ? (
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold uppercase tracking-wider">Cliente</span>
                    ) : (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold uppercase tracking-wider">Técnico de Campo</span>
                    )}
                    {viewingUser.id === currentUser.id && (
                      <span className="text-[9px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300 font-bold uppercase tracking-wider">Sua Conta</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">{viewingUser.email}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    viewingUser.status === 'working' ? 'bg-emerald-500 animate-pulse' : viewingUser.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {viewingUser.status === 'working' ? 'Em Atividade' : viewingUser.status === 'idle' ? 'Disponível' : 'Fora de Serviço'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ficha Details */}
            <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
              {/* Grid content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Personal Information */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">Informações Pessoais</h4>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Celular / WhatsApp</span>
                    <span className="text-xs font-bold text-slate-700">{viewingUser.phone || 'Não informado'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">CPF ou RG</span>
                    <span className="text-xs font-bold text-slate-700">{viewingUser.documentId || 'Não informado'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Data de Nascimento</span>
                    <span className="text-xs font-bold text-slate-700">
                      {viewingUser.birthDate ? new Date(viewingUser.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">Dados Corporativos</h4>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Data de Admissão</span>
                    <span className="text-xs font-bold text-slate-700">
                      {viewingUser.admissionDate ? new Date(viewingUser.admissionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Endereço Residencial</span>
                    <span className="text-xs font-bold text-slate-700">{viewingUser.address || 'Não cadastrado'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Código Funcional (ID)</span>
                    <span className="text-xs font-mono font-bold text-slate-600">{viewingUser.id}</span>
                  </div>
                </div>

                {/* Full Address / Notes (span both columns) */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">Observações & Anotações de RH</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap italic">
                    {viewingUser.notes || 'Sem anotações ou observações internas registradas nesta ficha.'}
                  </p>
                </div>

                {/* Signal Tracker coordinates */}
                {viewingUser.role === 'employee' && viewingUser.lastLatitude && (
                  <div className="sm:col-span-2 bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-emerald-600 uppercase block">Sinal de Localização GPS (Zentex Radar)</span>
                      <span className="font-mono font-bold text-emerald-700 block mt-0.5">Latitude: {viewingUser.lastLatitude.toFixed(6)} | Longitude: {viewingUser.lastLongitude?.toFixed(6)}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setMapSelectedUser(viewingUser);
                        setActiveTab('map');
                        setViewingUser(null);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Rastrear no Mapa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  handleOpenEditUser(viewingUser);
                  setViewingUser(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Image className="w-4 h-4" />
                <span>Editar Dados da Ficha</span>
              </button>

              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
