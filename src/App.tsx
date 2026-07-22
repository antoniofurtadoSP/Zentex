import React, { useState, useEffect, useCallback } from 'react';
import { User, ServiceOrder, ChatMessage, TimeCard } from './types';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ClientDashboard from './components/ClientDashboard';
import ZentexLogo from './components/ZentexLogo';
import ZentexAuth from './components/ZentexAuth';
import { getAvatarUrl } from './utils';
import { 
  Shield, Hammer, Users, RefreshCw, AlertCircle, Navigation, 
  Accessibility, Keyboard, Sun, Moon, Eye, Contrast, 
  Check, X, Plus, Minus, Info, LogOut, Lock, Key, Mail, Phone
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
  const [globalAlertMessage, setGlobalAlertMessage] = useState<string | null>(null);

  // Safely override window.alert with our custom modern accessible dialog to bypass sandboxed iframe restrictions
  useEffect(() => {
    (window as any).alert = (message: any) => {
      const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      setGlobalAlertMessage(msgStr);
    };
    (window as any).zentexSpeak = () => {};
    (window as any).zentexSpeakForce = () => {};
    (window as any).isVoiceEnabled = () => false;
  }, []);

  // Accessibility States
  const [fontSize, setFontSize] = useState<string>(() => localStorage.getItem('zentex-font-size') || '100%');
  const [theme, setTheme] = useState<'light' | 'dark' | 'contrast'>(() => (localStorage.getItem('zentex-theme') as any) || 'light');
  const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);

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

  // Client-side SVG-to-PNG fallback compiler for maximum reliability of PWA and mobile home-screen icons
  useEffect(() => {
    const ensurePngLogos = async () => {
      try {
        const checkRes = await fetch('/logo.png', { method: 'HEAD' });
        if (checkRes.ok) return; // Logo PNG already exists, skip client rendering

        const response = await fetch('/logo.svg');
        if (!response.ok) return;
        const svgText = await response.text();

        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 512, 512);
            const base64Png = canvas.toDataURL('image/png');
            await fetch('/api/save-logo-png', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Png, size: 512 })
            });
            console.log('PNG logo fallback generated client-side and cached on backend successfully.');
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (err) {
        console.warn('Client-side PNG rendering fallback failed or skipped:', err);
      }
    };
    ensurePngLogos();
  }, []);

  // Load everything from DB and sync current user session
  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Falha ao sincronizar dados com o servidor.');
      }
      let data = await response.json();

      const seedUserIds = ['admin1', 'admin2', 'emp1', 'emp2', 'emp3'];
      const seedOrderIds = ['OS-1001', 'OS-1002', 'OS-1003', 'OS-1004'];

      // Self-healing synchronization of custom data from browser localStorage
      let customUsersInStorage: User[] = [];
      try {
        customUsersInStorage = JSON.parse(localStorage.getItem('zentex-custom-users') || '[]');
      } catch (_) {}

      let customOrdersInStorage: ServiceOrder[] = [];
      try {
        customOrdersInStorage = JSON.parse(localStorage.getItem('zentex-custom-orders') || '[]');
      } catch (_) {}

      let needsSync = false;

      // Restore missing custom users
      for (const localUser of customUsersInStorage) {
        const exists = data.users.some((u: User) => u.id === localUser.id || u.email.toLowerCase() === localUser.email.toLowerCase());
        if (!exists) {
          console.info('[Zentex Sync] Restaurando usuário customizado ausente no servidor:', localUser.name);
          needsSync = true;
          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localUser)
            });
          } catch (e) {
            console.error('Falha ao sincronizar usuário:', e);
          }
        }
      }

      // Restore missing custom orders
      for (const localOrder of customOrdersInStorage) {
        const exists = data.orders.some((o: ServiceOrder) => o.id === localOrder.id);
        if (!exists) {
          console.info('[Zentex Sync] Restaurando ordem de serviço customizada ausente no servidor:', localOrder.title);
          needsSync = true;
          try {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localOrder)
            });
          } catch (e) {
            console.error('Falha ao sincronizar ordem de serviço:', e);
          }
        }
      }

      if (needsSync) {
        // Re-fetch database to get fully loaded data
        const reloadResponse = await fetch('/api/data');
        if (reloadResponse.ok) {
          data = await reloadResponse.json();
        }
      }

      // Update the localStorage cache with current custom users and orders from the server
      const currentCustomUsers = data.users.filter((u: User) => !seedUserIds.includes(u.id));
      const currentCustomOrders = data.orders.filter((o: ServiceOrder) => !seedOrderIds.includes(o.id));
      localStorage.setItem('zentex-custom-users', JSON.stringify(currentCustomUsers));
      localStorage.setItem('zentex-custom-orders', JSON.stringify(currentCustomOrders));

      setDb(data);
      
      const savedUserId = localStorage.getItem('zentex-user-id');
      if (savedUserId && data.users && data.users.length > 0) {
        const found = data.users.find((u: User) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('zentex-user-id');
        }
      } else {
        setCurrentUser(null);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Incapaz de conectar ao servidor Zentex.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Start active real-time operational polling every 5 seconds to update coordinates, orders, and chats dynamically
    const pollInterval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [loadData]);

  // Active real-time background GPS tracking & online heartbeat for logged-in users
  useEffect(() => {
    if (!currentUser) return;

    const trackAndHeartbeat = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              await fetch(`/api/users/${currentUser.id}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
              });
            } catch (e) {
              console.error('Failed to post heartbeat with location', e);
            }
          },
          async (error) => {
            console.warn('Geolocation failed for heartbeat, sending general heartbeat', error);
            try {
              await fetch(`/api/users/${currentUser.id}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
            } catch (e) {
              console.error('Failed to post fallback heartbeat', e);
            }
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        // No geolocation support
        fetch(`/api/users/${currentUser.id}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(e => console.error('Failed to post heartbeat', e));
      }
    };

    // Run immediately and then every 15 seconds to ensure real-time visibility
    trackAndHeartbeat();
    const bgHeartbeatInterval = setInterval(trackAndHeartbeat, 15000);
    return () => clearInterval(bgHeartbeatInterval);
  }, [currentUser]);

  // Keyboard shortcuts listener for operational accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A: Open/Close Accessibility Center
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAccessibilityModal(prev => !prev);
      }
      // Alt + T: Toggle Theme (Light -> Dark -> Contrast)
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(prev => {
          return prev === 'light' ? 'dark' : prev === 'dark' ? 'contrast' : 'light';
        });
      }
      // Alt + S: Sync operational data
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        loadData();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  // Actions
  const handleCreateOrder = async (orderData: Partial<ServiceOrder>): Promise<ServiceOrder | null> => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!response.ok) throw new Error();
      const createdOrder = await response.json();
      await loadData();
      return createdOrder;
    } catch {
      alert('Erro ao criar ordem de serviço.');
      return null;
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

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao excluir funcionário.');
        return;
      }
      await loadData();
    } catch {
      alert('Erro ao excluir funcionário.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao excluir ordem de serviço.');
        return;
      }
      await loadData();
    } catch {
      alert('Erro ao excluir ordem de serviço.');
    }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao realizar login.');
        return false;
      }
      localStorage.setItem('zentex-user-id', data.user.id);
      setCurrentUser(data.user);
      if ((window as any).zentexSpeakForce) {
        (window as any).zentexSpeakForce(`Sessão iniciada como ${data.user.name}`);
      }
      await loadData();
      return true;
    } catch {
      alert('Incapaz de conectar ao servidor Zentex.');
      return false;
    }
  };

  const handleRegisterSelf = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao criar conta.');
        return false;
      }
      localStorage.setItem('zentex-user-id', data.user.id);
      setCurrentUser(data.user);
      if ((window as any).zentexSpeakForce) {
        (window as any).zentexSpeakForce(`Sessão iniciada como ${data.user.name}`);
      }
      await loadData();
      return true;
    } catch {
      alert('Incapaz de conectar ao servidor Zentex.');
      return false;
    }
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erro ao alterar senha.');
        return false;
      }
      setCurrentUser(data.user);
      await loadData();
      return true;
    } catch {
      alert('Incapaz de conectar ao servidor Zentex.');
      return false;
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch (e) {
        console.error('Failed to post logout status', e);
      }
    }
    localStorage.removeItem('zentex-user-id');
    setCurrentUser(null);
    if ((window as any).zentexSpeakForce) {
      (window as any).zentexSpeakForce('Sessão encerrada.');
    }
    await loadData();
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
      <div className="min-h-screen bg-zentex-ambient flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4 bg-white/85 p-8 rounded-3xl shadow-3d-lg border border-slate-250/30 backdrop-blur-md">
          <Navigation className="w-12 h-12 text-emerald-600 animate-spin" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Carregando Zentex...</h2>
          <p className="text-xs text-slate-500 font-mono">Sincronizando satélites e base operacional</p>
        </div>
      </div>
    );
  }

  if (error || !db) {
    return (
      <div className="min-h-screen bg-zentex-ambient flex flex-col items-center justify-center text-slate-800 p-6">
        <div className="bg-white border border-slate-200 border-b-4 border-b-rose-500/60 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-3d-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-800">Falha na Conexão</h2>
          <p className="text-xs text-slate-600">Não foi possível conectar-se ao servidor central da Zentex. Verifique se o servidor está ativo.</p>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-3d-btn-emerald active:translate-y-0.5 active:shadow-inner transition-all cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zentex-ambient text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* PERSISTENT HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4 relative">
          
          {/* Left space spacer on desktop, hidden on mobile */}
          <div className="hidden md:block text-left text-[11px] font-bold text-slate-400 font-mono tracking-wider">
            ZENTEX OPERATIONAL HUB
          </div>

          {/* Logo Brand - Perfectly Centered */}
          <div className="flex justify-center">
            <ZentexLogo className="h-13 sm:h-14 md:h-16" />
          </div>

          {/* Right space - User Panel */}
          <div className="flex justify-center md:justify-end">
            {currentUser ? (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center md:justify-end">
                {/* OPERATIONAL USER PANEL */}
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 p-2 rounded-2xl shadow-sm">
                  <img src={getAvatarUrl(currentUser)} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-emerald-500/30" />
                  <div className="min-w-[120px] text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Acesso Operacional</p>
                    <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">{currentUser.name}</p>
                  </div>

                  {/* Quick Badges indicating current active interface */}
                  <div>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[9px] bg-red-50 text-red-750 font-black border border-red-200 rounded-lg px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-red-600" />
                        <span>Gerente</span>
                      </span>
                    ) : currentUser.role === 'client' ? (
                      <span className="text-[9px] bg-blue-50 text-blue-750 font-black border border-blue-200 rounded-lg px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600" />
                        <span>Cliente</span>
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-50 text-emerald-750 font-black border border-emerald-200 rounded-lg px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                        <Hammer className="w-3 h-3 text-emerald-600" />
                        <span>Técnico</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold shadow-3d-sm active-press transition-all duration-150 cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-2 rounded-2xl text-[10px] text-slate-500 font-bold uppercase tracking-wider shadow-3d-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <span>Portal de Acesso Seguro</span>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!currentUser ? (
          <ZentexAuth
            onLogin={handleLogin}
            onChangePassword={handleChangePassword}
            currentUser={currentUser}
            onLogout={handleLogout}
            onRegisterSelf={handleRegisterSelf}
          />
        ) : currentUser.isTemporaryPassword ? (
          <ZentexAuth
            onLogin={handleLogin}
            onChangePassword={handleChangePassword}
            currentUser={currentUser}
            onLogout={handleLogout}
            onRegisterSelf={handleRegisterSelf}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            users={db.users}
            orders={db.orders}
            timecards={db.timecards}
            messages={db.chats}
            onCreateOrder={handleCreateOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onRegisterUser={handleRegisterUser}
            onDeleteUser={handleDeleteUser}
            onSendMessage={handleSendMessage}
            onRefreshData={loadData}
            onResetDB={handleResetDB}
          />
        ) : currentUser.role === 'client' ? (
          <ClientDashboard
            currentUser={currentUser}
            users={db.users}
            orders={db.orders}
            messages={db.chats}
            onCreateOrder={handleCreateOrder}
            onSendMessage={handleSendMessage}
            onRefreshData={loadData}
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
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 mt-20 py-8 text-center text-[11px] text-slate-400 bg-white">
        <p>© 2026 Zentex Soluções Operacionais Ltda. Todos os direitos reservados.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-400">Desenvolvido em ambiente de alta fidelidade — GPS & Comunicação integrada de satélites.</p>
      </footer>

      {/* PERSISTENT FLOATING ACCESSIBILITY CONTROLLERS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 items-end">
        {/* Floating Toggle Button */}
        <button
          onClick={() => {
            setShowAccessibilityModal(true);
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

              {/* Box 3: Keyboard Navigation Guides */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-700 mb-2">
                  <Keyboard className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Guia de Atalhos Rápidos (Teclado)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { key: 'Alt + A', desc: 'Abrir/fechar este painel de acessibilidade' },
                    { key: 'Alt + T', desc: 'Alternar tema (Claro / Escuro / Alto Contraste)' },
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

      {/* GLOBAL CUSTOM NOTIFICATION MODAL (Bypasses sandboxed iframe limitations of window.alert) */}
      {globalAlertMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <Info className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Notificação Zentex</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line text-left">{globalAlertMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setGlobalAlertMessage(null)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 duration-150 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
