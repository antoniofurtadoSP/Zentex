import React, { useState, useEffect, useCallback } from 'react';
import { User, ServiceOrder, ChatMessage, TimeCard } from './types';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { 
  Shield, Hammer, Users, RefreshCw, AlertCircle, Sparkles, Navigation, 
  Accessibility, Volume2, VolumeX, Keyboard, Sun, Moon, Eye, Contrast, 
  Check, X, Plus, Minus, Info 
} from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<{
    users: User[];
    orders: ServiceOrder[];
    chats: ChatMessage[];
    timecards: TimeCard[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Accessibility States
  const [fontSize, setFontSize] = useState<string>(() => localStorage.getItem('zentex-font-size') || '100%');
  const [theme, setTheme] = useState<'light' | 'dark' | 'contrast'>(() => (localStorage.getItem('zentex-theme') as any) || 'light');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => localStorage.getItem('zentex-voice') === 'true');
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);

  // Helper function to synthesize text-to-speech
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  }, []);

  // Expose speak utility to global window context for subcomponents to trigger
  useEffect(() => {
    (window as any).zentexSpeak = (text: string) => {
      if (voiceEnabled || localStorage.getItem('zentex-voice') === 'true') {
        speakText(text);
      }
    };
    (window as any).zentexSpeakForce = (text: string) => {
      speakText(text);
    };
    (window as any).isVoiceEnabled = () => {
      return voiceEnabled;
    };
  }, [voiceEnabled, speakText]);

  // Sync state modifications with localStorage and HTML settings
  useEffect(() => {
    localStorage.setItem('zentex-font-size', fontSize);
    document.documentElement.style.fontSize = fontSize;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('zentex-theme', theme);
    const htmlEl = document.documentElement;
    htmlEl.classList.remove('dark-theme', 'contrast-theme');
    if (theme === 'dark') {
      htmlEl.classList.add('dark-theme');
    } else if (theme === 'contrast') {
      htmlEl.classList.add('contrast-theme');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zentex-voice', String(voiceEnabled));
  }, [voiceEnabled]);

  // Load everything from DB
  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Falha ao sincronizar dados com o servidor.');
      }
      const data = await response.json();
      setDb(data);
      
      // Initialize default user on first load
      if (!currentUser && data.users && data.users.length > 0) {
        // default to the admin (Antonio)
        const defaultUser = data.users.find((u: User) => u.id === 'admin1') || data.users[0];
        setCurrentUser(defaultUser);
      } else if (currentUser) {
        // Keep current user updated with latest state from server
        const updatedMe = data.users.find((u: User) => u.id === currentUser.id);
        if (updatedMe) {
          setCurrentUser(updatedMe);
        }
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Incapaz de conectar ao servidor Zentex.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts listener for operational accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A: Open/Close Accessibility Center
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAccessibilityModal(prev => !prev);
        speakText('Menu de acessibilidade alternado');
      }
      // Alt + V: Toggle Voice Feedback
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setVoiceEnabled(prev => {
          const next = !prev;
          speakText(next ? 'Assistente de voz Zentex ativado' : 'Assistente de voz Zentex desativado');
          return next;
        });
      }
      // Alt + T: Toggle Theme (Light -> Dark -> Contrast)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(prev => {
          const next = prev === 'light' ? 'dark' : prev === 'dark' ? 'contrast' : 'light';
          const name = next === 'light' ? 'Claro' : next === 'dark' ? 'Escuro' : 'Alto Contraste';
          speakText(`Visual alterado para ${name}`);
          return next;
        });
      }
      // Alt + S: Sync operational data
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        loadData();
        speakText('Banco de dados de campo sincronizado');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData, speakText]);

  // Actions
  const handleCreateOrder = async (orderData: Partial<ServiceOrder>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      alert('Erro ao criar ordem de serviço.');
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string, extraData?: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData })
      });
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      alert('Erro ao atualizar status da OS.');
    }
  };

  const handleRegisterUser = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      alert('Erro ao cadastrar funcionário.');
    }
  };

  const handleSendMessage = async (text: string, receiverId?: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, text, receiverId })
      });
      if (!response.ok) throw new Error();
      await loadData();
    } catch {
      alert('Erro ao enviar mensagem.');
    }
  };

  const handleClockAction = async (type: 'in' | 'out', latitude?: number, longitude?: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser.id, type, latitude, longitude })
      });
      const resData = await response.json();
      if (!response.ok) {
        alert(resData.error || 'Erro ao registrar ponto.');
        return;
      }
      await loadData();
      alert(`Ponto registrado com sucesso às ${new Date().toLocaleTimeString('pt-BR')}`);
    } catch {
      alert('Erro ao processar registro de ponto.');
    }
  };

  const handleResetDB = async () => {
    if (!window.confirm('Tem certeza que deseja restaurar as tabelas para os dados padrão?')) return;
    try {
      setLoading(true);
      const response = await fetch('/api/reset', { method: 'POST' });
      if (!response.ok) throw new Error();
      const resJson = await response.json();
      setDb(resJson.db);
      // reset current user
      const defaultUser = resJson.db.users.find((u: User) => u.id === 'admin1');
      setCurrentUser(defaultUser);
      alert('Banco de dados redefinido com sucesso!');
    } catch {
      alert('Erro ao redefinir banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Navigation className="w-12 h-12 text-emerald-600 animate-spin" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Carregando Zentex...</h2>
          <p className="text-xs text-slate-500 font-mono">Sincronizando satélites e base operacional</p>
        </div>
      </div>
    );
  }

  if (error || !db) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-800">Falha na Conexão</h2>
          <p className="text-xs text-slate-600">Não foi possível conectar-se ao servidor central da Zentex. Verifique se o servidor está ativo.</p>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* PERSISTENT HEADER SWITCHER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">ZENTEX</span>
                <span className="text-[9px] bg-emerald-150 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-300 uppercase tracking-widest bg-emerald-50">Ativo</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Gestão Operacional de Campo • Estilo Attendio</p>
            </div>
          </div>

          {/* OPERATIONAL LOGIN & IDENTITY PANEL */}
          <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200 p-2 rounded-2xl w-full sm:w-auto shadow-sm">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hidden md:block">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Identificação de Acesso</label>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const sel = db.users.find(u => u.id === e.target.value);
                    if (sel) {
                      setCurrentUser(sel);
                      if ((window as any).zentexSpeakForce) {
                        (window as any).zentexSpeakForce(`Sessão iniciada como ${sel.name}`);
                      }
                    }
                  }}
                  className="bg-transparent border-none text-xs font-bold text-slate-850 focus:outline-none cursor-pointer pr-4"
                >
                  {db.users.map(u => (
                    <option key={u.id} value={u.id} className="bg-white text-slate-800 text-xs">
                      {u.name} ({u.role === 'admin' ? 'Administrador' : 'Técnico'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Badges indicating current active interface */}
            <div className="text-right">
              {currentUser?.role === 'admin' ? (
                <span className="text-[10px] bg-red-50 text-red-700 font-black border border-red-200 rounded-lg px-2.5 py-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Gerente</span>
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black border border-emerald-200 rounded-lg px-2.5 py-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Técnico</span>
                </span>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentUser ? (
          currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              users={db.users}
              orders={db.orders}
              timecards={db.timecards}
              messages={db.chats}
              onCreateOrder={handleCreateOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onRegisterUser={handleRegisterUser}
              onSendMessage={handleSendMessage}
              onRefreshData={loadData}
              onResetDB={handleResetDB}
            />
          ) : (
            <EmployeeDashboard
              currentUser={currentUser}
              users={db.users}
              orders={db.orders}
              timecards={db.timecards}
              messages={db.chats}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onClockAction={handleClockAction}
              onSendMessage={handleSendMessage}
              onRefreshData={loadData}
            />
          )
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">
            Por favor, selecione um usuário no simulador de acesso acima.
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 mt-20 py-8 text-center text-[11px] text-slate-400 bg-white">
        <p>© 2026 Zentex Soluções Operacionais Ltda. Todos os direitos reservados.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-400">Desenvolvido em ambiente de alta fidelidade — GPS & Comunicação integrada de satélites.</p>
      </footer>

      {/* PERSISTENT FLOATING ACCESSIBILITY CONTROLLERS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 items-end">
        {/* Voice active quick-indicator */}
        {voiceEnabled && (
          <div className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Volume2 className="w-3 h-3" />
            <span>Voz Zentex Ativa</span>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => {
            setShowAccessibilityModal(true);
            speakText('Painel de acessibilidade aberto');
          }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 border border-emerald-400/20"
          aria-label="Configurações de acessibilidade"
          title="Atalho: Alt + A"
          id="zentex-accessibility-trigger"
        >
          <Accessibility className="w-4 h-4 text-white" />
          <span>Acessibilidade (Alt+A)</span>
        </button>
      </div>

      {/* BENTO-STYLE ACCESSIBILITY SETTINGS MODAL */}
      {showAccessibilityModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                  <Accessibility className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Acessibilidade Zentex</h3>
                  <p className="text-[10px] text-slate-400">Ajuste a interface para as necessidades da sua equipe de campo</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAccessibilityModal(false);
                  speakText('Painel de acessibilidade fechado');
                }}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                aria-label="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Box 1: Text Scaling (Tamanho do Texto) */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Tamanho da Letra</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Aumente o texto para melhorar a leitura sob luz solar direta.</p>
                </div>
                
                <div className="flex items-center gap-1.5 mt-3">
                  {[
                    { label: 'Normal', val: '100%' },
                    { label: 'Grande', val: '115%' },
                    { label: 'Enorme', val: '130%' }
                  ].map((sz) => (
                    <button
                      key={sz.val}
                      onClick={() => {
                        setFontSize(sz.val);
                        speakText(`Tamanho do texto ajustado para ${sz.label}`);
                      }}
                      className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all border cursor-pointer ${
                        fontSize === sz.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Box 2: Themes & Contrast (Visual e Contraste) */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-700 mb-2">
                    <Contrast className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Modos Visuais</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Alterne entre o tema padrão, escuro ou alto contraste (AAA).</p>
                </div>

                <div className="flex flex-col gap-1.5 mt-3">
                  {[
                    { label: 'Claro (Padrão)', val: 'light', icon: Sun },
                    { label: 'Escuro (Filtro Noturno)', val: 'dark', icon: Moon },
                    { label: 'Alto Contraste (AAA)', val: 'contrast', icon: Contrast }
                  ].map((tm) => {
                    const Icon = tm.icon;
                    return (
                      <button
                        key={tm.val}
                        onClick={() => {
                          setTheme(tm.val as any);
                          speakText(`Tema alterado para ${tm.label}`);
                        }}
                        className={`w-full flex items-center justify-between text-[10px] font-bold px-3 py-2 rounded-xl transition-all border cursor-pointer ${
                          theme === tm.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tm.label}</span>
                        </div>
                        {theme === tm.val && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box 3: Text-to-Speech (Zentex Voz) */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl col-span-1 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-slate-700 mb-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Assistente de Voz (Zentex Voz)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ativa a narração integrada. Se ativado, clique nos pequenos ícones de alto-falante para escutar ordens de serviço, conversas de chat ou instruções operacionais sendo faladas em português.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const newVal = !voiceEnabled;
                    setVoiceEnabled(newVal);
                    speakText(newVal ? 'Leitor de voz Zentex ativado' : 'Leitor de voz Zentex desativado');
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                    voiceEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span>Ativado (Voz Ligada)</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Desativado</span>
                    </>
                  )}
                </button>
              </div>

              {/* Box 4: Keyboard Navigation Guides */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-700 mb-2">
                  <Keyboard className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Guia de Atalhos Rápidos (Teclado)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { key: 'Alt + A', desc: 'Abrir/fechar este painel de acessibilidade' },
                    { key: 'Alt + T', desc: 'Alternar tema (Claro / Escuro / Alto Contraste)' },
                    { key: 'Alt + V', desc: 'Ativar / desativar assistente de voz' },
                    { key: 'Alt + S', desc: 'Sincronizar base operacional (Gps & Satélite)' }
                  ].map((sh, idx) => (
                    <div key={idx} className="bg-white border border-slate-150 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="font-mono text-[9px] font-black text-emerald-700 uppercase tracking-wider">{sh.key}</span>
                      <span className="text-[9px] text-slate-400 leading-tight mt-1">{sh.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Info */}
            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center gap-2 text-[10px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estas preferências são salvas localmente no navegador de cada técnico.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
