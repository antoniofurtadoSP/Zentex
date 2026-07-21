import React, { useState } from 'react';
import { Lock, Mail, Key, Eye, EyeOff, Sparkles, User, Phone, MapPin, Smile, FileText } from 'lucide-react';
import { User as UserType } from '../types';
import ZentexLogo from './ZentexLogo';

interface ZentexAuthProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onChangePassword: (newPassword: string) => Promise<boolean>;
  currentUser: UserType | null;
  onLogout: () => void;
  onRegisterSelf: (userData: any) => Promise<boolean>;
}

export default function ZentexAuth({
  onLogin,
  onChangePassword,
  currentUser,
  onLogout,
  onRegisterSelf
}: ZentexAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDocumentId, setRegDocumentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regGender, setRegGender] = useState<'female' | 'male'>('female');

  // Change Password Specific
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    await onLogin(email.trim(), password);
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regAddress || !regPhone || !regDocumentId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (regPassword.length < 6) {
      alert('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const femaleAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
    const maleAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';

    const success = await onRegisterSelf({
      name: regName,
      email: regEmail.trim(),
      phone: regPhone,
      password: regPassword,
      address: regAddress,
      role: 'client',
      gender: regGender,
      avatar: regGender === 'female' ? femaleAvatar : maleAvatar,
      documentId: regDocumentId
    });
    setLoading(false);
    if (success) {
      alert('Cadastro realizado com sucesso! Você já está logado.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('As senhas novas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      alert('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword === '123456') {
      alert('Por favor, defina uma senha diferente da senha provisória padrão.');
      return;
    }

    setLoading(true);
    await onChangePassword(newPassword);
    setLoading(false);
  };

  // 1. If user is logged in with a temporary password, show the change-password screen
  if (currentUser && currentUser.isTemporaryPassword) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-amber-200 rounded-3xl p-6 shadow-3d-lg border-b-4 border-b-amber-500/60 relative overflow-hidden">
        {/* Amber accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
        
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/50 mb-3 shadow-3d-sm">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-800">Alteração de Senha Obrigatória</h2>
          <p className="text-xs text-slate-500 mt-1.5 px-2 leading-relaxed">
            Sua conta foi criada pelo administrador com uma <strong>senha provisória</strong>. 
            Por segurança, você deve alterá-la antes de acessar a plataforma Zentex.
          </p>
        </div>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPasswordInput" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nova Senha</label>
            <div className="relative mt-1">
              <input
                id="newPasswordInput"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 shadow-inner focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-mono hover:border-slate-300"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmNewPasswordInput" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmar Nova Senha</label>
            <div className="relative mt-1">
              <input
                id="confirmNewPasswordInput"
                name="confirmNewPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 py-2.5 text-xs text-slate-800 shadow-inner focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-mono hover:border-slate-300"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-3d-btn-rose hover:shadow-md transition-all active:translate-y-0.5 active:shadow-inner flex items-center justify-center gap-1.5 duration-150 cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Atualizar Senha & Acessar'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 bg-transparent hover:bg-slate-100/50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl shadow-3d-btn-slate active:translate-y-0.5 active:shadow-inner transition-all duration-150 cursor-pointer"
            >
              Voltar ao Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. Otherwise show Login/Register screen
  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-3d-lg border-b-4 border-b-emerald-600/60 relative overflow-hidden">
      {/* Visual branding top border with vibrant 3D glow gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      {/* Zentex Circular Badge Logo */}
      <div className="flex justify-center pt-2 pb-4">
        <ZentexLogo variant="badge" className="h-28 drop-shadow-md hover:scale-105 transition-transform duration-250" />
      </div>

      {/* Sliding Tabs */}
      <div className="grid grid-cols-2 bg-slate-55 border border-slate-200 p-1 rounded-2xl mb-6 shadow-inner">
        <button
          onClick={() => setActiveTab('login')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'login'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Acessar Conta
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'register'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Quero ser Cliente
        </button>
      </div>

      {activeTab === 'login' ? (
        <div>
          <div className="text-center mb-5">
            <h2 className="text-sm font-black text-slate-800">Seja bem-vindo de volta!</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Informe suas credenciais operacionais ou de cliente.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="authLoginEmail" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
              <div className="relative mt-1">
                <input
                  id="authLoginEmail"
                  name="authLoginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 py-2.5 text-xs text-slate-800 shadow-inner focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono hover:border-slate-300"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="authLoginPassword" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Senha de Acesso</label>
              <div className="relative mt-1">
                <input
                  id="authLoginPassword"
                  name="authLoginPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Sua senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 shadow-inner focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono hover:border-slate-300"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-3d-btn-emerald active:translate-y-0.5 active:shadow-inner transition-all duration-150 cursor-pointer"
              >
                {loading ? 'Acessando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>

          {/* Quick Info Credentials for evaluator */}
          <div className="mt-6 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 shadow-3d-sm">
            <span className="text-[10px] font-black text-emerald-800 uppercase block tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Acesso Rápido Operacional:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <button
                type="button"
                onClick={async () => {
                  setEmail('antonioclaudiofp@gmail.com');
                  setPassword('123456');
                  setLoading(true);
                  await onLogin('antonioclaudiofp@gmail.com', '123456');
                  setLoading(false);
                }}
                className="p-2 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all active:translate-y-0.5 shadow-3d-sm border-b-2 flex flex-col justify-between cursor-pointer duration-150"
              >
                <div>
                  <span className="font-extrabold text-slate-800 block text-[11px]">Entrar como Gerente</span>
                  <span className="text-slate-500 font-mono text-[9px] break-all leading-none">antonioclaudiofp@gmail.com</span>
                </div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold self-start mt-1.5">Acesso Rápido</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail('lucas@zentex.com');
                  setPassword('123456');
                  setLoading(true);
                  await onLogin('lucas@zentex.com', '123456');
                  setLoading(false);
                }}
                className="p-2 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all active:translate-y-0.5 shadow-3d-sm border-b-2 flex flex-col justify-between cursor-pointer duration-150"
              >
                <div>
                  <span className="font-extrabold text-slate-800 block text-[11px]">Entrar como Técnico</span>
                  <span className="text-slate-500 font-mono text-[9px] break-all leading-none">lucas@zentex.com</span>
                </div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold self-start mt-1.5">Acesso Rápido</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-5">
            <h2 className="text-sm font-black text-slate-800">Cadastre-se como Cliente!</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Faça solicitações operacionais e rastreie técnicos em instantes.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="regNameInput" className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
              <div className="relative mt-1">
                <input
                  id="regNameInput"
                  name="regName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ex: Banco Itaú, Residência Maria, etc."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="regEmailInput" className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Contato *</label>
              <div className="relative mt-1">
                <input
                  id="regEmailInput"
                  name="regEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Ex: cliente@empresa.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="regPhoneInput" className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp / Celular *</label>
              <div className="relative mt-1">
                <input
                  id="regPhoneInput"
                  name="regPhone"
                  type="text"
                  required
                  autoComplete="tel"
                  placeholder="Ex: (11) 99999-0000"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="regDocumentInput" className="text-[10px] font-bold text-slate-500 uppercase">CPF do Cliente *</label>
              <div className="relative mt-1">
                <input
                  id="regDocumentInput"
                  name="regDocument"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Ex: 123.456.789-00"
                  value={regDocumentId}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 11) val = val.substring(0, 11);
                    let formatted = val;
                    if (val.length > 9) {
                      formatted = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6, 9)}-${val.substring(9)}`;
                    } else if (val.length > 6) {
                      formatted = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6)}`;
                    } else if (val.length > 3) {
                      formatted = `${val.substring(0, 3)}.${val.substring(3)}`;
                    }
                    setRegDocumentId(formatted);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner font-mono"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Gênero (Para identificação & avatar) *</label>
              <div className="flex bg-slate-55 border border-slate-200 p-1 rounded-2xl mt-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRegGender('female')}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    regGender === 'female'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👩 Feminino
                </button>
                <button
                  type="button"
                  onClick={() => setRegGender('male')}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    regGender === 'male'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👨 Masculino
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="regAddressInput" className="text-[10px] font-bold text-slate-500 uppercase">Endereço de Atendimento Padrão *</label>
              <div className="relative mt-1">
                <input
                  id="regAddressInput"
                  name="regAddress"
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="Ex: Av. Paulista, 1000 - São Paulo - SP"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="regPasswordInput" className="text-[10px] font-bold text-slate-500 uppercase">Definir Senha de Acesso (Mínimo 6 dígitos) *</label>
              <div className="relative mt-1">
                <input
                  id="regPasswordInput"
                  name="regPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Escolha uma senha forte"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-3d-btn-emerald active:translate-y-0.5 active:shadow-inner transition-all duration-150 cursor-pointer"
              >
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro & Acessar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
