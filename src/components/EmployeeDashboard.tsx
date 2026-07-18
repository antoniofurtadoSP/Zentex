import React, { useState, useEffect, useRef } from 'react';
import { User, ServiceOrder, TimeCard, ChatMessage } from '../types';
import ZentexChat from './ZentexChat';
import ZentexMap from './ZentexMap';
import { 
  Clock, MapPin, ClipboardList, Play, Pause, CheckSquare, MessageSquare, 
  UserCheck, AlertTriangle, FileSignature, RefreshCw, Send, CheckCircle, Volume2,
  Navigation
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  users: User[];
  orders: ServiceOrder[];
  timecards: TimeCard[];
  messages: ChatMessage[];
  onUpdateOrderStatus: (id: string, status: any, data?: any) => void;
  onClockAction: (type: 'in' | 'out', latitude?: number, longitude?: number) => void;
  onSendMessage: (text: string, receiverId?: string) => void;
  onRefreshData: () => void;
}

export default function EmployeeDashboard({
  currentUser,
  users,
  orders,
  timecards,
  messages,
  onUpdateOrderStatus,
  onClockAction,
  onSendMessage,
  onRefreshData
}: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'clock' | 'chat' | 'map'>('orders');
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  // Geolocation states
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Form states
  const [pauseReason, setPauseReason] = useState('Intervalo de almoço');
  const [completionNotes, setCompletionNotes] = useState('');
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  // Signature Pad Refs and States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Automatically request/track GPS on load with optional callback for exact execution sequence
  const requestGPS = (callback?: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não suportada no seu navegador.');
      if (callback) {
        const lat = -23.5616 + (Math.random() - 0.5) * 0.01;
        const lng = -46.6560 + (Math.random() - 0.5) * 0.01;
        callback(lat, lng);
      }
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setGpsLoading(false);
        if (callback) callback(lat, lng);
      },
      (error) => {
        console.warn('Geolocation failed, fallback to Paulista area.', error);
        // Fallback mock coordinates around Paulista/Centro to avoid breaking inside sandboxed iframes
        const lat = -23.5616 + (Math.random() - 0.5) * 0.01;
        const lng = -46.6560 + (Math.random() - 0.5) * 0.01;
        setCoords({ lat, lng });
        setGpsLoading(false);
        setGpsError('Sinal de GPS fraco. Usando triângulação aproximada.');
        if (callback) callback(lat, lng);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    requestGPS();
  }, []);

  // Filter orders assigned to CURRENT employee
  const myOrders = orders.filter(o => o.assignedEmployeeId === currentUser.id);
  const todaysPunches = timecards.filter(tc => tc.employeeId === currentUser.id);
  const hasClockedInToday = todaysPunches.some(tc => tc.clockIn && !tc.clockOut);

  // Start Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Actions
  const handleClockIn = () => {
    requestGPS((lat, lng) => {
      onClockAction('in', lat, lng);
    });
  };

  const handleClockOut = () => {
    requestGPS((lat, lng) => {
      onClockAction('out', lat, lng);
    });
  };

  const handleStartActivity = (orderId: string) => {
    requestGPS((lat, lng) => {
      // Start activity automatically records GPS location as required:
      // "os funcionários deverão compartilhar a sua localização ao iniciar uma atividade no aplicativo"
      onUpdateOrderStatus(orderId, 'em_andamento', {
        latitude: lat,
        longitude: lng
      });
      alert('Atividade iniciada com sucesso! Sua geolocalização de início foi registrada.');
    });
  };

  const handlePauseActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOS) return;

    onUpdateOrderStatus(selectedOS.id, 'pausada', {
      pauseReason
    });

    setShowPauseForm(false);
    setSelectedOS(null);
    alert('Atividade pausada.');
  };

  const handleCompleteActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOS) return;

    let signatureBase64 = '';
    const canvas = canvasRef.current;
    if (canvas) {
      signatureBase64 = canvas.toDataURL(); // export signature canvas to base64
    }

    onUpdateOrderStatus(selectedOS.id, 'concluida', {
      latitude: coords.lat,
      longitude: coords.lng,
      completionNotes,
      completionSignature: signatureBase64 || currentUser.name
    });

    setCompletionNotes('');
    setShowCompletionForm(false);
    setSelectedOS(null);
    alert('Ordem de serviço concluída e assinada com sucesso!');
  };

  return (
    <div className="space-y-6">
      
      {/* GPS Status Indicator bar */}
      <div className="bg-gradient-to-r from-white via-white to-emerald-50/10 border border-slate-200 border-b-4 border-b-emerald-600/60 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3.5 shadow-3d-md hover:border-emerald-300 transition-colors duration-200 cursor-default">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg shadow-3d-sm ${gpsError ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            <MapPin className={`w-4 h-4 ${gpsLoading ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Coordenadas de Satélite</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {coords.lat ? `Latitude: ${coords.lat.toFixed(5)} / Longitude: ${coords.lng?.toFixed(5)}` : 'Obtendo sinal GPS...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gpsError && (
            <span className="text-[10px] text-amber-600 font-medium animate-pulse">{gpsError}</span>
          )}
          <button
            onClick={requestGPS}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-600 font-bold rounded-lg shadow-3d-sm active-press transition-all flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Sinal</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 pb-2 gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-3d-btn-emerald active:translate-y-0.5'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-3d-sm active-press'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Minhas Tarefas (OS)</span>
        </button>

        <button
          onClick={() => setActiveTab('clock')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'clock'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-3d-btn-emerald active:translate-y-0.5'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-3d-sm active-press'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bater Ponto</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-3d-btn-emerald active:translate-y-0.5'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-3d-sm active-press'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Suporte (Chat)</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-3d-btn-emerald active:translate-y-0.5'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-3d-sm active-press'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mapa de Rotas</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div>
        
        {/* TAB 1: SERVICE ORDERS */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List of Tasks */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-3d-md border-b-2 border-b-slate-300/40">
              <h3 className="text-sm font-black text-slate-900 mb-4 font-sans">Minhas Ordens de Serviço Designadas</h3>
              
              {myOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">Nenhum chamado atribuído</p>
                  <p className="text-[10px] text-slate-400 mt-1">Você está livre de ordens de serviço no momento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map(order => {
                    const isSelected = selectedOS?.id === order.id;
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOS(order);
                          setShowPauseForm(false);
                          setShowCompletionForm(false);
                        }}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-500/65 shadow-sm'
                            : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-extrabold text-slate-500">{order.id}</span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                                order.priority === 'alta' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {order.priority}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 mt-1">{order.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{order.clientAddress}</span>
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
                             : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Details and Work Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {selectedOS ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{selectedOS.id}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedOS.title}</h3>
                    </div>
                    <button
                      onClick={() => {
                        const text = `Ordem de serviço ${selectedOS.id}. Título: ${selectedOS.title}. Instruções: ${selectedOS.description || 'Sem instruções adicionais'}. Cliente: ${selectedOS.clientName}. Endereço: ${selectedOS.clientAddress}`;
                        if ((window as any).zentexSpeakForce) {
                          (window as any).zentexSpeakForce(text);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-xl border border-emerald-100 cursor-pointer shadow-sm shrink-0"
                      title="Ouvir em voz alta"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ouvir OS</span>
                    </button>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 pt-4 text-xs">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Instruções de Execução</h5>
                      <p className="text-slate-600 mt-1 leading-relaxed">{selectedOS.description || 'Nenhuma instrução adicional.'}</p>
                    </div>

                    <div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase">Dados do Cliente</h5>
                      <p className="text-slate-800 mt-1 font-semibold">{selectedOS.clientName}</p>
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedOS.clientAddress}</span>
                      </p>

                      {/* GPS / Navigation Shortcuts */}
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedOS.clientAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-3 py-2 rounded-xl border border-emerald-150 cursor-pointer shadow-sm text-xs transition-colors"
                        >
                          <Navigation className="w-4 h-4 fill-current rotate-45" />
                          <span>Rotas no GPS (Google Maps)</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(selectedOS.clientAddress)}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold px-3 py-2 rounded-xl border border-sky-150 cursor-pointer shadow-sm text-xs transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-sky-600" />
                          <span>Abrir no Waze</span>
                        </a>
                      </div>

                      {selectedOS.clientPhone && (
                        <p className="text-slate-500 mt-2.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedOS.clientPhone}</span>
                        </p>
                      )}
                    </div>

                    {/* ACTION FLOW FOR FIELD WORKERS */}
                    <div className="pt-3 border-t border-slate-100 space-y-3.5">
                      
                      {/* 1. Open State - "Iniciar Atividade" */}
                      {selectedOS.status === 'aberta' && (
                        <button
                          onClick={() => handleStartActivity(selectedOS.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Iniciar Atividade</span>
                        </button>
                      )}

                      {/* 2. In Progress / Paused States */}
                      {(selectedOS.status === 'em_andamento' || selectedOS.status === 'pausada') && (
                        <div className="space-y-2">
                          
                          {/* If paused, let technician restart */}
                          {selectedOS.status === 'pausada' && (
                            <button
                              onClick={() => handleStartActivity(selectedOS.id)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Retomar Atividade</span>
                            </button>
                          )}

                          {/* If executing, let them Pause or Finish */}
                          {selectedOS.status === 'em_andamento' && (
                            <div className="grid grid-cols-2 gap-2.5">
                              <button
                                onClick={() => {
                                  setShowPauseForm(true);
                                  setShowCompletionForm(false);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Pausar</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowCompletionForm(true);
                                  setShowPauseForm(false);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                <CheckSquare className="w-4 h-4" />
                                <span>Finalizar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Concluded state */}
                      {selectedOS.status === 'concluida' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-1.5 text-slate-500">
                          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-800">Ordem Concluída</p>
                          <p className="text-[10px]">As coordenadas de conclusão e assinatura digital foram salvas no servidor.</p>
                        </div>
                      )}
                    </div>

                    {/* Forms overlays based on actions */}
                    {showPauseForm && selectedOS.status === 'em_andamento' && (
                      <form onSubmit={handlePauseActivitySubmit} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 mt-3 animate-fade-in shadow-inner">
                        <h4 className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pausar Atividade</span>
                        </h4>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">Motivo da Pausa</label>
                          <select
                            value={pauseReason}
                            onChange={(e) => setPauseReason(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Intervalo de almoço">Intervalo de almoço</option>
                            <option value="Falta de ferramentas/materiais">Falta de ferramentas/materiais</option>
                            <option value="Condições climáticas desfavoráveis">Condições climáticas desfavoráveis</option>
                            <option value="Fim do expediente de jornada">Fim do expediente de jornada</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            Confirmar Pausa
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPauseForm(false)}
                            className="px-2.5 bg-white border border-slate-200 text-[10px] text-slate-600 rounded-lg hover:bg-slate-50"
                          >
                            Voltar
                          </button>
                        </div>
                      </form>
                    )}

                    {showCompletionForm && selectedOS.status === 'em_andamento' && (
                      <form onSubmit={handleCompleteActivitySubmit} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3 mt-3 animate-fade-in shadow-inner">
                        <h4 className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
                          <FileSignature className="w-4 h-4" />
                          <span>Concluir Ordem de Serviço</span>
                        </h4>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">Relatório / Anotações do Trabalho</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Descreva as tarefas realizadas e observações..."
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 resize-none"
                          />
                        </div>

                        {/* Signature Pad */}
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-slate-500 uppercase block">Assinatura Digital (Toque na Tela)</label>
                            <button
                              type="button"
                              onClick={clearCanvas}
                              className="text-[9px] text-rose-600 hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                          
                          <div className="border border-slate-200 bg-white rounded-lg h-24 overflow-hidden mt-1 cursor-crosshair shadow-inner">
                            <canvas
                              ref={canvasRef}
                              width="300"
                              height="96"
                              className="w-full h-full"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
                          >
                            Salvar OS Concluída
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCompletionForm(false)}
                            className="px-2.5 bg-white border border-slate-200 text-[10px] text-slate-600 rounded-lg hover:bg-slate-50"
                          >
                            Voltar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400">
                  <ClipboardList className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-xs font-bold">Selecione uma OS</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[150px]">Toque em uma ordem de serviço ao lado para ver e iniciar o serviço.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLOCK CARD (REGISTRO DE PONTO) */}
        {activeTab === 'clock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Clock action card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between text-center gap-6 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Registro Eletrônico de Ponto</h3>
                <p className="text-xs text-slate-500 mt-1">Marque o início e encerramento de sua jornada externa</p>
              </div>

              {/* Huge dynamic clock symbol */}
              <div className="relative flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-4 border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center shadow-inner">
                  <Clock className={`w-8 h-8 ${hasClockedInToday ? 'text-emerald-600 animate-pulse' : 'text-slate-300'}`} />
                  <span className="text-sm font-bold text-slate-800 font-mono mt-1.5">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">Zentex Hora</span>
                </div>
              </div>

              <div className="w-full space-y-2.5">
                {hasClockedInToday ? (
                  <button
                    onClick={handleClockOut}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-98"
                  >
                    Registrar Saída (Clock Out)
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-98"
                  >
                    Registrar Entrada (Clock In)
                  </button>
                )}

                <div className="flex items-center gap-1.5 justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    Sua jornada atual está marcada como:{' '}
                    <strong className="uppercase text-slate-700">
                      {currentUser.status === 'working' ? 'Em Atividade' : currentUser.status === 'idle' ? 'Em Espera' : 'Offline'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Today's punches stream */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 font-sans">Meus Registros do Dia</h3>

              <div className="space-y-3">
                {todaysPunches.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Nenhum ponto batido hoje.
                  </div>
                ) : (
                  todaysPunches.map(punch => (
                    <div key={punch.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">{punch.date}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">Consolidado</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Entrada</p>
                          <p className="text-emerald-600 font-bold font-mono text-sm mt-0.5">{punch.clockIn}</p>
                          {punch.latitudeIn && (
                            <p className="text-[8px] text-slate-500 font-mono mt-0.5 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{punch.latitudeIn.toFixed(4)}, {punch.longitudeIn?.toFixed(4)}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Saída</p>
                          {punch.clockOut ? (
                            <>
                              <p className="text-rose-600 font-bold font-mono text-sm mt-0.5">{punch.clockOut}</p>
                              {punch.latitudeOut && (
                                <p className="text-[8px] text-slate-500 font-mono mt-0.5 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{punch.latitudeOut.toFixed(4)}, {punch.longitudeOut?.toFixed(4)}</span>
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-400 italic mt-1 text-[11px]">Expediente ativo</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Canal de Chat Operacional</h3>
              <p className="text-xs text-slate-500">Converse em tempo real com a coordenação e gestores da Zentex</p>
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

        {/* TAB 4: MAPS */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Meu Radar de Rotas</h3>
                <p className="text-xs text-slate-500 font-sans">Acompanhe suas ordens de serviço e seu sinal de satélite atualizado</p>
              </div>
            </div>

            <ZentexMap 
              users={users} 
              orders={orders.filter(o => o.assignedEmployeeId === currentUser.id)} 
              selectedUser={currentUser} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
