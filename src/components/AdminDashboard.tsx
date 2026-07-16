import React, { useState } from 'react';
import { User, ServiceOrder, TimeCard, ChatMessage, OSPriority } from '../types';
import ZentexMap from './ZentexMap';
import ZentexChat from './ZentexChat';
import { 
  Plus, Users, ClipboardList, Map, MessageSquare, Clock, ShieldCheck, 
  TrendingUp, CheckCircle, AlertTriangle, Play, HelpCircle, Phone, 
  MapPin, Eye, Calendar, UserPlus, RefreshCcw, Download
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  orders: ServiceOrder[];
  timecards: TimeCard[];
  messages: ChatMessage[];
  onCreateOrder: (order: Partial<ServiceOrder>) => void;
  onUpdateOrderStatus: (id: string, status: any, data?: any) => void;
  onRegisterUser: (user: Partial<User>) => void;
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
  onRegisterUser,
  onSendMessage,
  onRefreshData,
  onResetDB
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'employees' | 'map' | 'chat' | 'timecards'>('overview');
  
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
      name: empName,
      email: empEmail,
      phone: empPhone,
      avatar: empAvatar || undefined,
      role: 'employee'
    });

    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpAvatar('');
    setShowEmployeeModal(false);
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

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Ordens Ativas</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{activeOrders}</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">+{pendingOrders} abertas</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Técnicos em Campo</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{workingEmployees + idleEmployees}</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">/{totalEmployees} cadastrados</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">OS Concluídas</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{completedOrders}</span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">Este mês</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Pontos Batidos</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{timecards.length}</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold">Hoje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {([
            { id: 'overview', label: 'Visão Geral', icon: ShieldCheck },
            { id: 'orders', label: 'Ordens de Serviço (OS)', icon: ClipboardList },
            { id: 'employees', label: 'Funcionários (Equipe)', icon: Users },
            { id: 'map', label: 'Mapa de Equipes', icon: Map },
            { id: 'chat', label: 'Chat Interno', icon: MessageSquare },
            { id: 'timecards', label: 'Registros de Ponto', icon: Clock }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
            title="Sincronizar Dados"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onResetDB}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Restaurar Banco de Dados ao estado padrão de testes"
          >
            Restaurar Seeds
          </button>
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
                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
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
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2 text-[10px] text-slate-500">
                        <span>Cliente: <strong>{order.clientName}</strong></span>
                        <span>Atribuído a: <strong>{order.assignedEmployeeName || 'Sem designação'}</strong></span>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Equipe de Funcionários</h3>
                <p className="text-xs text-slate-500">Cadastre novos funcionários e monitore o status de jornada deles</p>
              </div>

              <button
                onClick={() => setShowEmployeeModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Funcionário</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.filter(u => u.role === 'employee').map(emp => {
                const empActiveOrdersCount = orders.filter(o => o.assignedEmployeeId === emp.id && o.status === 'em_andamento').length;
                return (
                  <div key={emp.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <img src={emp.avatar} alt={emp.name} className="w-11 h-11 rounded-full object-cover border border-white shadow-sm" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          emp.status === 'working' ? 'bg-emerald-500' : emp.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-800 truncate">{emp.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.email}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{emp.phone || 'Sem telefone'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Status de Atividade</span>
                        <span className={`font-bold uppercase tracking-wider ${
                          emp.status === 'working' ? 'text-emerald-600' : emp.status === 'idle' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {emp.status === 'working' ? `Ativo (${empActiveOrdersCount} OS)` : emp.status === 'idle' ? 'Disponível' : 'Offline'}
                        </span>
                      </div>

                      {emp.lastLatitude && (
                        <div className="text-right">
                          <span className="text-slate-500 block">Último Sinal</span>
                          <button 
                            onClick={() => {
                              setMapSelectedUser(emp);
                              setActiveTab('map');
                            }}
                            className="text-emerald-600 hover:text-emerald-700 hover:underline font-mono font-bold flex items-center gap-0.5 justify-end"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Ver Mapa</span>
                          </button>
                        </div>
                      )}
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
              <h3 className="text-sm font-bold text-slate-900 font-sans">Central de Mensagens em Tempo Real</h3>
              <p className="text-xs text-slate-500">Comunicação corporativa direta com a equipe em campo</p>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Título da OS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manutenção Preventiva do Ar Condicionado"
                    value={osTitle}
                    onChange={(e) => setOsTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição da OS</label>
                  <textarea
                    rows={2}
                    placeholder="Descreva as tarefas e o problema relatado..."
                    value={osDescription}
                    onChange={(e) => setOsDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Banco Itaú Paulista"
                    value={osClientName}
                    onChange={(e) => setOsClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone do Cliente</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98888-7777"
                    value={osClientPhone}
                    onChange={(e) => setOsClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço do Chamado *</label>
                  <input
                    type="text"
                    required
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

      {/* MODAL 2: REGISTER EMPLOYEE */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Cadastrar Novo Funcionário</span>
              </h3>
              <button 
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleRegisterEmployeeSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Ferreira da Silva"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Operacional *</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: joao@zentex.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Celular / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-8888"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Foto do Perfil (URL)</label>
                <input
                  type="text"
                  placeholder="Ex: https://images.unsplash.com/photo-..."
                  value={empAvatar}
                  onChange={(e) => setEmpAvatar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md"
                >
                  Cadastrar Técnico
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
    </div>
  );
}
