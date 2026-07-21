import React, { useState, useEffect } from 'react';
import { 
  Clipboard, Send, Clock, User, Phone, MapPin, CheckCircle, 
  AlertCircle, Sparkles, MessageSquare, 
  Map, UserCheck, ShieldAlert, Eye, Settings, FileText, ChevronRight, X, Image,
  Zap, Home, Building, Check, CreditCard, Smartphone, Lock, Copy
} from 'lucide-react';
import { User as UserType, ServiceOrder, ChatMessage, OSPriority } from '../types';
import { getAvatarUrl } from '../utils';

interface ZentexService {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePricePerM2: number;
  minPrice: number;
  bannerColor: string;
  badge: string;
  extras: { id: string; name: string; price: number }[];
}

const ZENTEX_SERVICES: ZentexService[] = [
  {
    id: 'limpeza-residencial',
    name: 'Limpeza Residencial',
    description: 'Higienização de rotina ou profunda para casas e apartamentos. Quartos, salas, banheiros e cozinha.',
    icon: 'Home',
    basePricePerM2: 3.20,
    minPrice: 150.00,
    bannerColor: 'from-blue-500 to-cyan-500',
    badge: 'Mais Solicitado',
    extras: [
      { id: 'geladeira', name: 'Limpeza de Geladeira por Dentro', price: 40.00 },
      { id: 'armarios', name: 'Limpeza Interna de Armários', price: 60.00 },
      { id: 'forno', name: 'Limpeza de Forno', price: 30.00 },
      { id: 'passar-roupa', name: 'Passar Roupas (Cesto Médio)', price: 50.00 }
    ]
  },
  {
    id: 'limpeza-comercial',
    name: 'Limpeza Comercial',
    description: 'Higienização técnica de salas comerciais, escritórios, consultórios e lojas.',
    icon: 'Building',
    basePricePerM2: 4.50,
    minPrice: 190.00,
    bannerColor: 'from-emerald-500 to-teal-500',
    badge: 'Empresas',
    extras: [
      { id: 'copa-completa', name: 'Limpeza de Copa/Cozinha Completa', price: 50.00 },
      { id: 'lixeiras-extra', name: 'Troca Técnica de Lixeiras Extra', price: 20.00 },
      { id: 'computadores', name: 'Higienização de Teclados e Monitores', price: 30.00 }
    ]
  },
  {
    id: 'pos-obra',
    name: 'Limpeza Pós-Obra',
    description: 'Remoção de poeira de gesso, cimento, respingos de tinta e resíduos de reforma.',
    icon: 'Zap',
    basePricePerM2: 8.90,
    minPrice: 450.00,
    bannerColor: 'from-amber-500 to-orange-500',
    badge: 'Limpeza Pesada',
    extras: [
      { id: 'area-externa', name: 'Lavagem de Calçadas e Áreas Externas', price: 80.00 },
      { id: 'entulho', name: 'Descarte e Ensacamento de Entulho Leve', price: 100.00 },
      { id: 'esquadrias-tecnica', name: 'Limpeza Técnica de Trilhos e Esquadrias', price: 60.00 }
    ]
  },
  {
    id: 'limpeza-vidros',
    name: 'Limpeza de Vidros & Janelas',
    description: 'Limpeza técnica interna e externa de janelas, divisórias de vidro, vitrines e espelhos.',
    icon: 'Eye',
    basePricePerM2: 3.50,
    minPrice: 130.00,
    bannerColor: 'from-purple-500 to-pink-500',
    badge: 'Brilho Máximo',
    extras: [
      { id: 'chuva-acida', name: 'Remoção de Manchas de Chuva Ácida', price: 50.00 },
      { id: 'caixilhos', name: 'Polimento Técnico de Caixilhos e Borrachas', price: 30.00 }
    ]
  },
  {
    id: 'sanitizacao',
    name: 'Sanitização de Ambientes',
    description: 'Atomização eletrostática de Quaternário de Amônio contra vírus, bactérias e fungos.',
    icon: 'CheckCircle',
    basePricePerM2: 2.80,
    minPrice: 180.00,
    bannerColor: 'from-cyan-500 to-blue-500',
    badge: 'Saúde & Proteção',
    extras: [
      { id: 'laudo-tecnico', name: 'Laudo de Sanitização Certificado', price: 40.00 },
      { id: 'filtro-ar', name: 'Higienização de Filtros de Ar-Condicionado', price: 35.00 }
    ]
  },
  {
    id: 'pre-mudanca',
    name: 'Limpeza Pré-Mudança',
    description: 'Higienização profunda completa para entrada em novo imóvel residencial ou comercial.',
    icon: 'Clipboard',
    basePricePerM2: 5.50,
    minPrice: 240.00,
    bannerColor: 'from-indigo-500 to-purple-600',
    badge: 'Novo Imóvel',
    extras: [
      { id: 'desinfec-armario', name: 'Desinfecção de Armários Vazios', price: 60.00 },
      { id: 'lavagem-garagem', name: 'Limpeza Básica de Garagem', price: 40.00 }
    ]
  }
];

const getZentexServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'Building': return <Building className="w-5 h-5 text-emerald-600 animate-pulse" />;
    case 'Home': return <Home className="w-5 h-5 text-emerald-600 animate-pulse" />;
    case 'Zap': return <Zap className="w-5 h-5 text-emerald-600 animate-pulse" />;
    case 'Eye': return <Eye className="w-5 h-5 text-emerald-600 animate-pulse" />;
    case 'CheckCircle': return <CheckCircle className="w-5 h-5 text-emerald-600 animate-pulse" />;
    case 'Clipboard': return <Clipboard className="w-5 h-5 text-emerald-600 animate-pulse" />;
    default: return <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />;
  }
};

interface ClientDashboardProps {
  currentUser: UserType;
  users: UserType[];
  orders: ServiceOrder[];
  messages: ChatMessage[];
  onCreateOrder: (orderData: Partial<ServiceOrder>) => Promise<ServiceOrder | null>;
  onSendMessage: (text: string, receiverId?: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export default function ClientDashboard({
  currentUser,
  users,
  orders,
  messages,
  onCreateOrder,
  onSendMessage,
  onRefreshData
}: ClientDashboardProps) {
  // Configuração e Fallback da Account Hash conforme solicitado
  const ACCOUNT_HASH = ((import.meta as any).env?.VITE_EFI_ACCOUNT_HASH as string) || "3931688641e8e06302526275df0fada3";

  const [activeTab, setActiveTab] = useState<'request' | 'my-orders' | 'chat' | 'profile'>('request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<OSPriority>('media');
  const [address, setAddress] = useState(currentUser.address || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic calculator states
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [m2Size, setM2Size] = useState<number>(50);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [observations, setObservations] = useState<string>('');

  // Payment state variables
  const [selectedPayMethod, setSelectedPayMethod] = useState<'pix' | 'credit' | 'debit' | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardCpf, setCardCpf] = useState(currentUser.documentId || '');
  const [isPaying, setIsPaying] = useState(false);
  const [hasCopiedPix, setHasCopiedPix] = useState(false);
  const [showReceiptOrder, setShowReceiptOrder] = useState<ServiceOrder | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<ServiceOrder | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'pix' | 'card'>('pix');
  const [checkoutPixData, setCheckoutPixData] = useState<{ pixCopiaECola: string, qrcodeImageUrl?: string, qrcodeImageBase64?: string, txid: string, isDemo: boolean } | null>(null);
  const [checkoutCardName, setCheckoutCardName] = useState('');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('');
  const [checkoutCardCVV, setCheckoutCardCVV] = useState('');
  const [checkoutCardCpf, setCheckoutCardCpf] = useState(currentUser.documentId || '');
  const [checkoutCardEmail, setCheckoutCardEmail] = useState(currentUser.email || '');
  const [checkoutInstallments, setCheckoutInstallments] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [sandboxSimulation, setSandboxSimulation] = useState<'approved' | 'declined'>('approved');
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const [efiPublicConfig, setEfiPublicConfig] = useState<{
    isSandbox: boolean;
    hasConfig: boolean;
    hasCardConfig?: boolean;
    hasPixConfig?: boolean;
    accountCode: string;
    pixKey: string;
  } | null>(null);
  const [efiSdkStatus, setEfiSdkStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed' | 'missing_config'>('idle');
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    fetch('/api/payment/efi/public-config')
      .then(res => res.json())
      .then(data => setEfiPublicConfig(data))
      .catch(err => console.error('Erro ao buscar configuração Efí:', err));
  }, []);

  // Verificação de formulário de pagamento com cartão (Solicitação ou Modal de Pagamento)
  const isCardPaymentActive = (selectedPayMethod === 'credit' || selectedPayMethod === 'debit') || (!!checkoutOrder && checkoutMethod === 'card');

  // Carregamento Sob Demanda (Lazy Loading) do SDK da Efí Pay exclusivamente quando o formulário de cartão estiver ativo na tela
  useEffect(() => {
    if (!isCardPaymentActive) return;

    console.log('[Efí SDK] Formulário de cartão ativo: Carregando SDK sob demanda...');
    loadEfiSdk().catch(err => {
      console.warn('[Efí SDK] Erro ao carregar CDN do Efí Bank no carregamento sob demanda:', err);
    });
  }, [isCardPaymentActive, efiPublicConfig]);

  const loadEfiSdk = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const win = window as any;
      const activeAccountCode = efiPublicConfig?.accountCode || ACCOUNT_HASH || '3931688641e8e06302526275df0fada3';

      if (win.$gn) {
        try {
          if (typeof win.$gn.setAccount === 'function') {
            win.$gn.setAccount(activeAccountCode);
          }
          console.log('[Efí SDK] Módulo validado instantaneamente!');
          setIsSdkReady(true);
          setEfiSdkStatus('loaded');
        } catch (e) {
          console.error('[Efí SDK] Erro ao configurar setAccount:', e);
        }
        return resolve(win.$gn);
      }

      const isSandboxEnv = efiPublicConfig
        ? (efiPublicConfig.isSandbox || !efiPublicConfig.hasCardConfig)
        : true;

      const urls = isSandboxEnv
        ? ['https://sandbox.gerencianet.com.br/v1/cdn', 'https://api.gerencianet.com.br/v1/cdn']
        : ['https://api.gerencianet.com.br/v1/cdn', 'https://sandbox.gerencianet.com.br/v1/cdn'];

      setEfiSdkStatus('loading');

      const tryLoadScript = (index: number) => {
        if (index >= urls.length) {
          setEfiSdkStatus('failed');
          return reject(new Error('Não foi possível carregar o módulo de segurança da Efí Bank.'));
        }

        const currentUrl = urls[index];
        const scriptId = 'efi-sdk-script';

        const oldScript = document.getElementById(scriptId);
        if (oldScript) {
          oldScript.remove();
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = currentUrl;
        script.type = 'text/javascript';
        script.async = true;

        script.onload = () => {
          if (win.$gn) {
            try {
              if (typeof win.$gn.setAccount === 'function') {
                win.$gn.setAccount(activeAccountCode);
              }
              setIsSdkReady(true);
              setEfiSdkStatus('loaded');
            } catch (e) {
              console.error('[Efí SDK] Erro no setAccount no onload:', e);
            }
            resolve(win.$gn);
          }
        };

        script.onerror = () => {
          console.warn(`[Efí SDK] Falha ao carregar CDN (${currentUrl}), tentando fallback se disponível...`);
          tryLoadScript(index + 1);
        };

        document.head.appendChild(script);
      };

      const existingScript = document.getElementById('efi-sdk-script');
      if (!existingScript) {
        tryLoadScript(0);
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (win.$gn) {
          clearInterval(interval);
          try {
            if (typeof win.$gn.setAccount === 'function') {
              win.$gn.setAccount(activeAccountCode);
            }
            console.log('[Efí SDK] Módulo verificado e pronto!');
            setIsSdkReady(true);
            setEfiSdkStatus('loaded');
          } catch (e) {
            console.error('[Efí SDK] Erro ao configurar setAccount:', e);
          }
          resolve(win.$gn);
        } else if (attempts > 25) { // 7.5s
          clearInterval(interval);
          setEfiSdkStatus('failed');
          reject(new Error('Não foi possível carregar o módulo de segurança da Efí Bank a tempo.'));
        }
      }, 300);
    });
  };

  const detectCardBrand = (number: string): string => {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(606282|5067|4576|4011)/.test(clean)) return 'elo';
    if (/^50[0-9]/.test(clean)) return 'maestro';
    if (/^6[045]/.test(clean)) return 'discover';
    if (/^(38|60)/.test(clean)) return 'hipercard';
    return 'visa';
  };

  const getEfiCardToken = async (cardDetails: {
    brand: string;
    number: string;
    cvv: string;
    expirationMonth: string;
    expirationYear: string;
  }): Promise<string> => {
    const isSandbox = efiPublicConfig 
      ? (efiPublicConfig.isSandbox || !efiPublicConfig.hasCardConfig) 
      : true;

    let efiSdk: any = null;
    try {
      efiSdk = await loadEfiSdk();
    } catch (err: any) {
      console.warn('[Efí SDK] Não foi possível carregar o CDN do Efí Bank:', err?.message);
      if (isSandbox) {
        console.log('[Efí SDK] Modo Sandbox/Simulação ativo: gerando token de simulação de desenvolvimento.');
        return 'token_simulado_desenvolvedor';
      } else {
        throw new Error('Não foi possível carregar o módulo de segurança da Efí Bank. Verifique sua conexão com a internet ou se há bloqueadores de anúncios ativados.');
      }
    }

    return new Promise((resolve, reject) => {
      const activeAccountCode = efiPublicConfig?.accountCode || ACCOUNT_HASH || '3931688641e8e06302526275df0fada3';

      try {
        if (typeof efiSdk.setAccount === 'function') {
          efiSdk.setAccount(activeAccountCode);
          console.log('[Efí SDK - Tokenização] setAccount configurado dinamicamente antes de tokenizar:', activeAccountCode);
        }
      } catch (err) {
        console.error('[Efí SDK] Erro ao re-garantir setAccount no getEfiCardToken:', err);
      }

      const timeoutId = setTimeout(() => {
        console.warn('[Efí SDK] Timeout na tokenização do cartão.');
        reject(new Error('Tempo limite excedido ao inicializar o cartão'));
      }, 8000);

      const doTokenize = (checkoutObj: any) => {
        try {
          checkoutObj.getPaymentToken({
            brand: cardDetails.brand,
            number: cardDetails.number,
            cvv: cardDetails.cvv,
            expiration_month: cardDetails.expirationMonth,
            expiration_year: cardDetails.expirationYear
          }, (error: any, response: any) => {
            clearTimeout(timeoutId);
            if (error) {
              console.error('[Efí Bank SDK - Erro Crítico de Tokenização]', JSON.stringify(error, null, 2));
              reject(new Error(error.error_description || error.message || `Erro da Efí: Code ${error.code} - ${error.error}`));
            } else {
              if (response && response.data && response.data.payment_token) {
                resolve(response.data.payment_token);
              } else {
                console.error('[Efí Bank SDK - Resposta Inválida]', response);
                reject(new Error('Resposta inválida do SDK de tokenização da Efí Bank (campo payment_token ausente).'));
              }
            }
          });
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error('[Efí Bank SDK - Exceção em getPaymentToken]', err);
          if (!isSandbox) {
            reject(new Error(err.message || 'Erro interno do SDK da Efí ao gerar o token de pagamento.'));
          } else {
            resolve('token_simulado_desenvolvedor');
          }
        }
      };

      if (typeof efiSdk.ready === 'function') {
        try {
          efiSdk.ready((checkout: any) => {
            doTokenize(checkout);
          });
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (!isSandbox) {
            reject(new Error(err.message || 'Erro de inicialização do SDK da Efí no checkout.'));
          } else {
            resolve('token_simulado_desenvolvedor');
          }
        }
      } else if (typeof efiSdk.payData === 'function') {
        doTokenize(efiSdk);
      } else {
        clearTimeout(timeoutId);
        if (!isSandbox) {
          reject(new Error('SDK da Efí carregado, mas método de tokenização não disponível.'));
        } else {
          resolve('token_simulado_desenvolvedor');
        }
      }
    });
  };

  // Fetch real Pix data from Efí Bank when checkout is opened
  useEffect(() => {
    if (!checkoutOrder) {
      setCheckoutPixData(null);
      setCheckoutError(null);
      setCheckoutSuccess(false);
      return;
    }

    if (checkoutMethod === 'pix' && !checkoutPixData && !checkoutLoading) {
      const fetchPix = async () => {
        setCheckoutLoading(true);
        setCheckoutError(null);
        try {
          const res = await fetch('/api/payment/efi/create-pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: checkoutOrder.id,
              amount: checkoutOrder.price,
              clientName: currentUser.name,
              clientCpf: currentUser.documentId || checkoutCardCpf // can use CPF if available or leave empty
            })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.details || data.error || 'Erro ao gerar cobrança Pix.');
          }

          setCheckoutPixData(data);
        } catch (err: any) {
          console.error(err);
          setCheckoutError(err.message || 'Erro de conexão ou escopo de API mTLS com a Efí.');
        } finally {
          setCheckoutLoading(false);
        }
      };

      fetchPix();
    }
  }, [checkoutOrder, checkoutMethod]);

  const handleConfirmPixPayment = async () => {
    if (!checkoutOrder) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      // Update order status to paid (paymentStatus 'pago')
      const res = await fetch(`/api/orders/${checkoutOrder.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'pago',
          paymentMethod: 'pix'
        })
      });

      if (!res.ok) throw new Error('Erro ao registrar liquidação.');

      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutOrder(null);
        onRefreshData();
      }, 2500);
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao liquidar pagamento.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const validateFormFields = (params: {
    name: string;
    number: string;
    expiry: string;
    cvv: string;
    cpf: string;
  }): { isValid: boolean; error: string | null } => {
    console.log('[Zentex OS] --- INICIANDO VALIDAÇÃO DO CARTÃO ---');
    console.log(`- Nome do Titular: "${params.name}"`);
    console.log(`- Número do Cartão: "${params.number.replace(/\s+/g, '')}"`);
    console.log(`- Validade: "${params.expiry}"`);
    console.log(`- CVV: "${params.cvv}"`);
    console.log(`- CPF/CNPJ: "${params.cpf}"`);

    // 1. Nome do Titular
    const isNameValid = params.name.trim().length >= 3;
    console.log(`- Status Nome do Titular: ${isNameValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!isNameValid) {
      return { isValid: false, error: 'O nome impresso no cartão deve ter pelo menos 3 caracteres.' };
    }

    // 2. Número do Cartão (Luhn)
    const cleanNum = params.number.replace(/\D/g, '');
    let isNumValid = cleanNum.length >= 13 && cleanNum.length <= 19;
    if (isNumValid) {
      let sum = 0;
      let shouldDouble = false;
      for (let i = cleanNum.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNum.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      isNumValid = (sum % 10 === 0);
    }
    console.log(`- Status Número do Cartão: ${isNumValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!isNumValid) {
      return { isValid: false, error: 'O número do cartão de crédito informado é inválido. Verifique os números digitados.' };
    }

    // 3. Validade (MM/AA)
    const cleanExp = params.expiry.replace(/\D/g, '');
    let isExpValid = cleanExp.length === 4;
    if (isExpValid) {
      const month = parseInt(cleanExp.substring(0, 2), 10);
      const yearShort = parseInt(cleanExp.substring(2, 4), 10);
      if (month < 1 || month > 12) {
        isExpValid = false;
      } else {
        const now = new Date();
        const currentYearShort = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        if (yearShort < currentYearShort || (yearShort === currentYearShort && month < currentMonth)) {
          isExpValid = false;
        }
      }
    }
    console.log(`- Status Validade do Cartão: ${isExpValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    if (!isExpValid) {
      return { isValid: false, error: 'A data de validade está incorreta ou expirada. Use o formato MM/AA (ex: 12/29).' };
    }

    // 4. CVV
    const cleanCvv = params.cvv.replace(/\D/g, '');
    const isCvvValid = cleanCvv.length >= 3 && cleanCvv.length <= 4;
    console.log(`- Status CVV: ${isCvvValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!isCvvValid) {
      return { isValid: false, error: 'O código de segurança (CVV) do cartão é inválido (deve conter 3 ou 4 dígitos).' };
    }

    // 5. CPF/CNPJ
    const cleanCpf = params.cpf.replace(/\D/g, '');
    let isCpfValid = cleanCpf.length === 11 || cleanCpf.length === 14;
    if (isCpfValid && cleanCpf.length === 11) {
      if (/^(\d)\1{10}$/.test(cleanCpf)) {
        isCpfValid = false;
      } else {
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) {
          sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf.substring(9, 10), 10)) {
          isCpfValid = false;
        } else {
          sum = 0;
          for (let i = 1; i <= 10; i++) {
            sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (12 - i);
          }
          remainder = (sum * 10) % 11;
          if (remainder === 10 || remainder === 11) remainder = 0;
          if (remainder !== parseInt(cleanCpf.substring(10, 11), 10)) {
            isCpfValid = false;
          }
        }
      }
    }
    console.log(`- Status CPF/CNPJ: ${isCpfValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!isCpfValid) {
      return { isValid: false, error: 'O CPF ou CNPJ informado é inválido. Verifique os números digitados.' };
    }

    console.log('[Zentex OS] --- VALIDAÇÃO CONCLUÍDA COM SUCESSO ✅ ---');
    return { isValid: true, error: null };
  };

  const handleConfirmCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutOrder) return;
    
    if (!checkoutCardName || !checkoutCardNumber || !checkoutCardExpiry || !checkoutCardCVV || !checkoutCardCpf) {
      const missing = [];
      if (!checkoutCardName) missing.push('Nome Impresso');
      if (!checkoutCardNumber) missing.push('Número do Cartão');
      if (!checkoutCardExpiry) missing.push('Validade (MM/AA)');
      if (!checkoutCardCVV) missing.push('CVV');
      if (!checkoutCardCpf) missing.push('CPF/CNPJ do Titular');
      
      setCheckoutError(`Por favor, preencha todos os campos obrigatórios do cartão: ${missing.join(', ')}`);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      // 1. Tratamento Imediato de Erro na Inicialização
      if (!ACCOUNT_HASH || ACCOUNT_HASH.trim() === "" || ACCOUNT_HASH === "SUA_ACCOUNT_HASH_AQUI") {
        throw new Error("Erro: Chave Account Hash não configurada");
      }

      const validation = validateFormFields({
        name: checkoutCardName,
        number: checkoutCardNumber,
        expiry: checkoutCardExpiry,
        cvv: checkoutCardCVV,
        cpf: checkoutCardCpf
      });

      if (!validation.isValid) {
        throw new Error(validation.error || 'Campos do cartão inválidos.');
      }

      const [expiryMonth, expiryYearShort] = checkoutCardExpiry.split('/');
      const brand = detectCardBrand(checkoutCardNumber);
      const expirationMonth = expiryMonth.trim();
      const expirationYear = expiryYearShort ? `20${expiryYearShort.trim()}` : '';

      // 1. Tokenize card using Efí SDK (returns simulation token if SDK not loaded or sandbox)
      const cardToken = await getEfiCardToken({
        brand,
        number: checkoutCardNumber.replace(/\D/g, ''),
        cvv: checkoutCardCVV.replace(/\D/g, ''),
        expirationMonth,
        expirationYear
      });

      const activeIsSandbox = efiPublicConfig 
        ? efiPublicConfig.isSandbox 
        : ((import.meta as any).env.VITE_EFI_SANDBOX === 'true' || (import.meta as any).env.VITE_EFI_SANDBOX === true);

      if (!cardToken || (!activeIsSandbox && cardToken === 'token_simulado_desenvolvedor')) {
        throw new Error('A geração do token do cartão falhou ou retornou um token inválido.');
      }

      // 2. Post payment charge to the server
      const payRes = await fetch('/api/payment/efi/charge-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: checkoutOrder.id,
          amount: checkoutOrder.price,
          cardToken,
          clientName: checkoutCardName,
          clientEmail: checkoutCardEmail || currentUser.email || 'cliente@zentex.com',
          clientCpf: checkoutCardCpf,
          installments: checkoutInstallments,
          sandboxSimulation: sandboxSimulation
        })
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData.details || payData.error || 'Erro ao processar pagamento com cartão na Efí Bank.');
      }

      if (payData.success === false || (payData.status !== 'pago' && payData.status !== 'ativa' && !payData.isDemo)) {
        throw new Error(`O pagamento não foi autorizado pelo banco emissor. Status: ${payData.status || 'Recusado'}`);
      }

      // 3. Register transaction as paid on our systems
      const res = await fetch(`/api/orders/${checkoutOrder.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'pago',
          paymentMethod: 'credit'
        })
      });

      if (!res.ok) throw new Error('Erro ao registrar liquidação.');

      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutOrder(null);
        onRefreshData();
      }, 2500);
    } catch (err: any) {
      console.error('[Efí Bank SDK - Erro Crítico]', err);
      setCheckoutError(err.message || 'Erro ao processar cartão.');
      alert(err.message || 'Erro ao processar cartão.');
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  // Profile settings
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAddress, setProfileAddress] = useState(currentUser.address || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Chat operational states
  const [chatText, setChatText] = useState('');
  const [chatMode, setChatMode] = useState<'manager' | 'bot'>('bot');
  const [botMessages, setBotMessages] = useState<any[]>([
    {
      id: 'bot_welcome',
      senderId: 'zentex_bot',
      senderName: 'Zentex Bot',
      senderRole: 'bot',
      text: 'Olá! Sou o Zentex Bot, seu assistente virtual de atendimento operacional. 🤖✨\n\nEstou aqui para esclarecer suas dúvidas sobre nossos serviços de Limpeza e Conservação, mostrar nossos pacotes com preços fixos ou ajudá-lo a abrir uma solicitação.\n\nComo posso ajudar você hoje?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Selected order for tracking radar
  const [trackingOrder, setTrackingOrder] = useState<ServiceOrder | null>(null);

  // Filter client's orders
  const clientOrders = orders.filter(
    o => o.createdBy === currentUser.id || o.clientName === currentUser.name
  );

  const handleSelectService = (service: ZentexService) => {
    setSelectedService(service);
    setM2Size(50);
    setSelectedExtras([]);
    setObservations('');
    setTitle(service.name);
  };

  const handleBotResponse = async (userText: string) => {
    // Append user message to bot messages first
    const userMsg = {
      id: `user_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'client' as const,
      text: userText,
      timestamp: new Date().toISOString()
    };

    setBotMessages(prev => [...prev, userMsg]);
    setIsBotTyping(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          // Limit history to last 10 messages for lightweight context
          history: botMessages.slice(-10)
        })
      });

      if (!response.ok) throw new Error('Failed to fetch bot response');
      const data = await response.json();

      setBotMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          senderId: 'zentex_bot',
          senderName: 'Zentex Bot',
          senderRole: 'bot',
          text: data.response,
          timestamp: new Date().toISOString()
        }
      ]);
      setIsBotTyping(false);

      // If transferToHuman was triggered by Gemini
      if (data.transferToHuman) {
        // Automatically send the message to the human chat so the manager receives it!
        await onSendMessage(`[Mensagem Transferida do Bot]: ${userText}`, 'admin1');
        
        // Notify user they are being transferred and switch mode
        setTimeout(() => {
          setChatMode('manager');
          setTimeout(() => {
            const container = document.getElementById('client-chat-scroll');
            if (container) container.scrollTop = container.scrollHeight;
          }, 100);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to get bot response', err);
      // Fallback
      setIsBotTyping(false);
      
      // Fallback response matching
      let botResponse = '';
      let transferToHuman = false;
      const textLower = userText.toLowerCase();

      if (textLower.includes('pacote') || textLower.includes('valor') || textLower.includes('preço') || textLower.includes('preco') || textLower.includes('quanto') || textLower.includes('custo') || textLower.includes('tabela')) {
        botResponse = `Oferecemos 5 excelentes **Pacotes com Preços Fixos** para facilitar seu atendimento:\n\n` +
          `1️⃣ **Limpeza Comercial Express**: R$ 190,00 (Salas de até 60m², aspiração, pó, lixeiras e banheiros)\n` +
          `2️⃣ **Limpeza Residencial Profunda**: R$ 290,00 (Casas de até 100m², cozinha/banheiros completos)\n` +
          `3️⃣ **Limpeza Pós-Obra Master**: R$ 790,00 (Limpeza pesada pós-reforma)\n` +
          `4️⃣ **Limpeza de Vidros & Vitrines**: R$ 160,00 (Limpeza técnica de vidraças térreas)\n` +
          `5️⃣ **Sanitização de Ambientes**: R$ 380,00 (Higienização contra germes com laudo)\n\n` +
          `💡 *Dica:* Você pode ir para a aba **"Pedir Serviço"** para selecionar qualquer um desses pacotes prontos!`;
      } else if (textLower.includes('rastrear') || textLower.includes('tecnico') || textLower.includes('téc') || textLower.includes('onde está') || textLower.includes('mapa') || textLower.includes('radar')) {
        botResponse = `A Zentex possui um exclusivo sistema de **Rastreamento via Radar**! 📡\n\n` +
          `Para rastrear seu técnico:\n` +
          `1. Vá para a aba **"Minhas Ordens"** no menu principal.\n` +
          `2. Encontre a solicitação que está com o status **"Em Andamento"**.\n` +
          `3. Clique em **"Rastrear no Radar"** para abrir o mapa em tempo real!`;
      } else if (textLower.includes('cadastro') || textLower.includes('perfil') || textLower.includes('mudar') || textLower.includes('alterar') || textLower.includes('endereço')) {
        botResponse = `Você pode atualizar seus dados cadastrais indo até a aba **"Meu Cadastro"** no menu superior! Lá você altera nome, telefone, foto e endereço padrão.`;
      } else if (textLower.includes('gerente') || textLower.includes('humano') || textLower.includes('suporte') || textLower.includes('atendimento') || textLower.includes('falar com')) {
        botResponse = `Sem problemas! Estou te transferindo para o suporte de nossa gerência humana para um atendimento personalizado.`;
        transferToHuman = true;
      } else {
        botResponse = `Entendi! Sou o assistente virtual da Zentex. No momento estou em modo offline inteligente. Você pode me perguntar sobre **"pacotes"**, **"rastrear técnico"**, ou **"alterar cadastro"**. Se desejar falar com um gerente humano, basta me pedir ou mudar para a aba **"Suporte (Gerência)"** no topo!`;
      }

      setBotMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          senderId: 'zentex_bot',
          senderName: 'Zentex Bot',
          senderRole: 'bot',
          text: botResponse,
          timestamp: new Date().toISOString()
        }
      ]);

      if (transferToHuman) {
        await onSendMessage(`[Mensagem Transferida do Bot]: ${userText}`, 'admin1');
        setTimeout(() => {
          setChatMode('manager');
          setTimeout(() => {
            const container = document.getElementById('client-chat-scroll');
            if (container) container.scrollTop = container.scrollHeight;
          }, 100);
        }, 3000);
      }
    }

    // scroll bottom
    setTimeout(() => {
      const container = document.getElementById('bot-chat-scroll');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const calculatePriceBreakdown = () => {
    if (!selectedService) {
      return {
        isPackage: false,
        basePrice: 0,
        extras: 0,
        prioritySurcharge: 0,
        total: 0,
        breakdownLines: ['Selecione um serviço para calcular']
      };
    }

    const lines: string[] = [];
    const areaVal = m2Size * selectedService.basePricePerM2;
    let basePrice = areaVal;
    
    if (areaVal < selectedService.minPrice) {
      basePrice = selectedService.minPrice;
      lines.push(`Taxa Mínima do Serviço (${selectedService.name}): R$ ${selectedService.minPrice.toFixed(2).replace('.', ',')}`);
    } else {
      lines.push(`Cálculo por Área (${m2Size}m² x R$ ${selectedService.basePricePerM2.toFixed(2).replace('.', ',')}/m²): R$ ${areaVal.toFixed(2).replace('.', ',')}`);
    }

    // Extras
    let extrasTotal = 0;
    selectedExtras.forEach(extraId => {
      const extraItem = selectedService.extras.find((e: any) => e.id === extraId);
      if (extraItem) {
        extrasTotal += extraItem.price;
        lines.push(`Adicional: ${extraItem.name}: + R$ ${extraItem.price.toFixed(2).replace('.', ',')}`);
      }
    });

    // Urgency surcharge
    let prioritySurcharge = 0;
    const subtotal = basePrice + extrasTotal;
    if (priority === 'alta') {
      prioritySurcharge = subtotal * 0.3;
      lines.push(`Acréscimo de Urgência Operacional (Alta 30%): + R$ ${prioritySurcharge.toFixed(2).replace('.', ',')}`);
    } else if (priority === 'baixa') {
      prioritySurcharge = -subtotal * 0.1;
      lines.push(`Desconto por Agendamento Flexível (Baixa -10%): - R$ ${Math.abs(prioritySurcharge).toFixed(2).replace('.', ',')}`);
    } else {
      lines.push('Urgência de Atendimento Média: Sem acréscimo');
    }

    const total = subtotal + prioritySurcharge;

    return {
      isPackage: false,
      basePrice,
      extras: extrasTotal,
      prioritySurcharge,
      total: Math.max(selectedService.minPrice, total),
      breakdownLines: lines
    };
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let orderTitle = title;
    let orderDescription = description;

    if (selectedService) {
      orderTitle = selectedService.name;
      const extrasNames = selectedExtras
        .map(id => selectedService.extras.find((ex: any) => ex.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      orderDescription = `Solicitação de ${selectedService.name} para área de ${m2Size}m².\n` +
        `• Urgência: ${priority.toUpperCase()}\n` +
        (extrasNames ? `• Adicionais: ${extrasNames}\n` : '') +
        (observations ? `• Observações: ${observations}\n` : '');
    }

    if (!orderTitle || !orderDescription || !address) {
      alert('Por favor, selecione um serviço, preencha as especificações e o endereço de atendimento.');
      return;
    }

    if (!selectedPayMethod) {
      alert('Por favor, escolha uma forma de pagamento (Pix, Cartão de Crédito ou Débito) no painel abaixo antes de enviar.');
      return;
    }

    setIsPaying(true);
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const priceData = calculatePriceBreakdown();

      // 1. CREDIT CARD / DEBIT CARD FLOW
      if (selectedPayMethod === 'credit' || selectedPayMethod === 'debit') {
        if (!cardName || !cardNumber || !cardExpiry || !cardCVV || !cardCpf) {
          const missing = [];
          if (!cardName) missing.push('Nome Impresso');
          if (!cardNumber) missing.push('Número do Cartão');
          if (!cardExpiry) missing.push('Validade (MM/AA)');
          if (!cardCVV) missing.push('CVV');
          if (!cardCpf) missing.push('CPF/CNPJ do Titular');
          
          throw new Error(`Por favor, preencha todos os campos obrigatórios do cartão: ${missing.join(', ')}`);
        }

        // 1. Tratamento Imediato de Erro na Inicialização
        if (!ACCOUNT_HASH || ACCOUNT_HASH.trim() === "" || ACCOUNT_HASH === "SUA_ACCOUNT_HASH_AQUI") {
          throw new Error("Erro: Chave Account Hash não configurada");
        }

        const validation = validateFormFields({
          name: cardName,
          number: cardNumber,
          expiry: cardExpiry,
          cvv: cardCVV,
          cpf: cardCpf
        });

        if (!validation.isValid) {
          throw new Error(validation.error || 'Campos do cartão inválidos.');
        }

        const [expiryMonth, expiryYearShort] = cardExpiry.split('/');
        const brand = detectCardBrand(cardNumber);
        const expirationMonth = expiryMonth.trim();
        const expirationYear = expiryYearShort ? `20${expiryYearShort.trim()}` : '';

        // Generate card token via Efí SDK or Developer simulation
        const cardToken = await getEfiCardToken({
          brand,
          number: cardNumber.replace(/\D/g, ''),
          cvv: cardCVV.replace(/\D/g, ''),
          expirationMonth,
          expirationYear
        });

        const activeIsSandbox = efiPublicConfig 
          ? efiPublicConfig.isSandbox 
          : ((import.meta as any).env.VITE_EFI_SANDBOX === 'true' || (import.meta as any).env.VITE_EFI_SANDBOX === true);

        if (!cardToken || (!activeIsSandbox && cardToken === 'token_simulado_desenvolvedor')) {
          throw new Error('A geração do token do cartão falhou ou retornou um token inválido.');
        }

        // Submit charge transaction to the backend
        const payRes = await fetch('/api/payment/efi/charge-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: `OS-TEMP-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: priceData.total,
            cardToken,
            clientName: cardName,
            clientEmail: currentUser.email || 'cliente@zentex.com',
            clientCpf: cardCpf || currentUser.documentId || '00000000000',
            installments: 1,
            sandboxSimulation: sandboxSimulation
          })
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          throw new Error(payData.details || payData.error || 'Erro ao processar pagamento com cartão na Efí Bank.');
        }

        if (payData.success === false || (payData.status !== 'pago' && payData.status !== 'ativa' && !payData.isDemo)) {
          throw new Error(`O pagamento não foi autorizado pelo banco emissor. Status: ${payData.status || 'Recusado'}`);
        }

        // Create paid order on DB
        await onCreateOrder({
          title: orderTitle,
          description: orderDescription,
          clientName: currentUser.name,
          clientAddress: address,
          clientPhone: phone || currentUser.phone || '',
          priority,
          status: 'aberta',
          createdBy: currentUser.id,
          price: priceData.total,
          paymentStatus: 'pago',
          paymentMethod: selectedPayMethod,
          paymentDate: new Date().toISOString()
        });

        // Clear fields
        setTitle('');
        setDescription('');
        setPriority('media');
        setSelectedPayMethod(null);
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCVV('');
        setSelectedService(null);
        setM2Size(50);
        setSelectedExtras([]);
        setObservations('');

        alert('Pagamento aprovado e solicitação enviada com sucesso! Um administrador irá analisar e atribuir um técnico em breve.');
        setActiveTab('my-orders');

      } else if (selectedPayMethod === 'pix') {
        // 2. PIX FLOW (Creates pending order and instantly opens secure checkout modal)
        const createdOrder = await onCreateOrder({
          title: orderTitle,
          description: orderDescription,
          clientName: currentUser.name,
          clientAddress: address,
          clientPhone: phone || currentUser.phone || '',
          priority,
          status: 'aberta',
          createdBy: currentUser.id,
          price: priceData.total,
          paymentStatus: 'pendente',
          paymentMethod: 'pix'
        });

        if (createdOrder) {
          // Clear fields
          setTitle('');
          setDescription('');
          setPriority('media');
          setSelectedPayMethod(null);
          setSelectedService(null);
          setM2Size(50);
          setSelectedExtras([]);
          setObservations('');

          // Bind order and method, instantly showing the mTLS secure checkout modal
          setCheckoutOrder(createdOrder);
          setCheckoutMethod('pix');
          setActiveTab('my-orders');

          alert('Sua solicitação foi registrada com sucesso! Copie a chave Pix ou escaneie o QR Code no painel de Checkout Seguro para concluir seu pagamento.');
        } else {
          throw new Error('Falha ao registrar a ordem de serviço.');
        }
      }

    } catch (err: any) {
      console.error('[Efí Bank SDK - Erro Crítico]', err);
      alert(err.message || 'Erro ao processar transação de pagamento.');
    } finally {
      setIsPaying(false);
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentUser,
          name: profileName,
          phone: profilePhone,
          address: profileAddress,
          avatar: profileAvatar || getAvatarUrl(currentUser)
        })
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await onRefreshData();
      } else {
        alert('Erro ao atualizar dados cadastrais.');
      }
    } catch {
      alert('Erro de conexão ao salvar perfil.');
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      await onSendMessage(chatText.trim(), 'admin1'); // Send directly to the main admin channel
      setChatText('');
      setTimeout(() => {
        const container = document.getElementById('client-chat-scroll');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch {
      alert('Erro ao enviar mensagem.');
    }
  };

  // Filter chat messages relevant to client (sent by client or sent by admin/employees with no specific receiver, or direct to client)
  const clientChatMessages = messages.filter(
    msg => msg.senderId === currentUser.id || msg.receiverId === currentUser.id || (!msg.receiverId && msg.senderRole === 'admin')
  );

  return (
    <div className="space-y-6">
      {/* HEADER BANNER FOR CLIENT PORTAL */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-black uppercase tracking-widest text-emerald-100 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zentex Express</span>
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Olá, {currentUser.name}!
            </h2>
            <p className="text-xs text-emerald-100/90 max-w-xl">
              Solicite serviços de limpeza e conservação em tempo real, acompanhe o status da sua ordem de serviço e rastreie o técnico designado via satélite direto no mapa.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[160px]">
            <span className="text-[10px] text-emerald-100 font-bold block uppercase tracking-wider">Solicitações Ativas</span>
            <span className="text-3xl font-black font-mono block mt-1">
              {clientOrders.filter(o => o.status !== 'concluida' && o.status !== 'cancelada').length}
            </span>
            <span className="text-[9px] text-emerald-200 mt-0.5 block">em andamento ou abertas</span>
          </div>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="grid grid-cols-4 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-3d-sm">
        <button
          onClick={() => setActiveTab('request')}
          className={`py-3 text-xs font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'request'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Pedir Serviço</span>
        </button>

        <button
          onClick={() => setActiveTab('my-orders')}
          className={`py-3 text-xs font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'my-orders'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>Minhas Ordens</span>
          {clientOrders.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
              activeTab === 'my-orders' ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-700'
            }`}>
              {clientOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`py-3 text-xs font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Falar com Zentex</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 text-xs font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Meu Cadastro</span>
        </button>
      </div>

      {/* TAB 1: SERVICE REQUEST FORM */}
      {activeTab === 'request' && (
        <div className="space-y-6">
          {!selectedService ? (
            /* SERVICE CATEGORIES SELECTOR DASHBOARD */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span>Serviços Prestados Zentex</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Selecione o tipo de serviço que deseja contratar para calcular o valor personalizado.</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-3 py-1 rounded-full border border-emerald-100 animate-pulse self-start uppercase tracking-wider">Passo 1: Selecione</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ZENTEX_SERVICES.map((srv) => {
                  const srvIcon = getZentexServiceIcon(srv.icon);
                  return (
                    <div 
                      key={srv.id} 
                      className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 hover:border-emerald-400 hover:shadow-md hover:bg-white transition-all flex flex-col justify-between relative overflow-hidden group border-b-4 hover:border-b-emerald-500 duration-250 cursor-pointer"
                      onClick={() => handleSelectService(srv)}
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-slate-600 to-slate-850 px-2 py-0.5 rounded-full shadow-sm">
                          {srv.badge}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                            {srvIcon}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">{srv.name}</h4>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Taxa Mínima: R$ {srv.minPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed min-h-[40px]">{srv.description}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-slate-400 uppercase font-black block">Custo p/ m²</span>
                          <span className="text-xs font-black text-slate-700 font-mono tracking-tight">R$ {srv.basePricePerM2.toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectService(srv);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-emerald-200" />
                          <span>Selecionar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* DETAILED ESTIMATOR AND CALCULATOR PANEL */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(null);
                        setTitle('');
                        setDescription('');
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all text-slate-500 hover:text-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="text-[8px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">Passo 2: Configure</span>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mt-0.5">
                        {getZentexServiceIcon(selectedService.icon)}
                        <span>{selectedService.name}</span>
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(null);
                      setTitle('');
                      setDescription('');
                    }}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 uppercase tracking-wider"
                  >
                    Alterar Serviço
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Configuration column (m2, urgency, details) */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Size Slider Input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tamanho da Área em m² *</label>
                        <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">{m2Size} m²</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={m2Size}
                        onChange={(e) => setM2Size(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                        <span>10 m²</span>
                        <span>150 m²</span>
                        <span>300 m²</span>
                        <span>500 m²</span>
                      </div>
                    </div>

                    {/* Urgency Selection */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Urgência *</label>
                      <div className="grid grid-cols-3 gap-2 mt-1.5">
                        {(['baixa', 'media', 'alta'] as OSPriority[]).map((prio) => (
                          <button
                            type="button"
                            key={prio}
                            onClick={() => setPriority(prio)}
                            className={`py-2 rounded-xl border font-bold text-xs capitalize transition-all cursor-pointer ${
                              priority === prio
                                ? prio === 'alta'
                                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-1 ring-rose-200'
                                  : prio === 'media'
                                  ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-1 ring-amber-200'
                                  : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {prio === 'baixa' ? 'Baixa (-10%)' : prio === 'media' ? 'Média (Normal)' : 'Alta (+30%)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Extras Checkbox */}
                    {selectedService.extras.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Adicionais Extras Opcionais</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedService.extras.map((extra: any) => {
                            const isChecked = selectedExtras.includes(extra.id);
                            return (
                              <label
                                key={extra.id}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
                                    : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedExtras(selectedExtras.filter(id => id !== extra.id));
                                    } else {
                                      setSelectedExtras([...selectedExtras, extra.id]);
                                    }
                                  }}
                                />
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="text-[10px] font-semibold leading-tight block text-slate-800">{extra.name}</span>
                                  <span className="text-[9px] text-emerald-600 font-mono block">+ R$ {extra.price.toFixed(2)}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Observations */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Demais informações necessárias & Observações</label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Restrições de horários, animais no local, detalhes sobre portas de vidro ou pontos críticos para focarmos..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="servicePhone" className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Telefone / WhatsApp</label>
                        <input
                          id="servicePhone"
                          name="servicePhone"
                          type="text"
                          autoComplete="tel"
                          placeholder="Ex: (11) 99999-8888"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label htmlFor="serviceAddress" className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Endereço de Atendimento *</label>
                        <input
                          id="serviceAddress"
                          name="serviceAddress"
                          type="text"
                          required
                          autoComplete="street-address"
                          placeholder="Endereço completo"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculator and Payment column (Price, pix, credit, pay button) */}
                  <div className="lg:col-span-2 space-y-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        // Format dynamic summary for the service order description
                        const extrasNames = selectedExtras
                          .map(id => selectedService.extras.find((ex: any) => ex.id === id)?.name)
                          .filter(Boolean)
                          .join(', ');
                        
                        const fullDescription = `Solicitação de ${selectedService.name} para área de ${m2Size}m².\n` +
                          `• Urgência: ${priority.toUpperCase()}\n` +
                          (extrasNames ? `• Adicionais: ${extrasNames}\n` : '') +
                          (observations ? `• Observações: ${observations}\n` : '');

                        // Sync state so the onSubmit logic receives it correctly
                        setDescription(fullDescription);
                        
                        handleCreateRequest(e);
                      }}
                      className="space-y-4"
                    >
                      {/* DYNAMIC PRICING ESTIMATOR */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Cálculo em Tempo Real</h4>
                            <p className="text-[8px] text-slate-400 font-medium">Transparência e exatidão operacional</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {calculatePriceBreakdown().breakdownLines.map((line, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] text-slate-600 gap-2">
                              <span className="font-medium flex items-center gap-1 shrink truncate">
                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="truncate">{line.split(':')[0]}</span>
                              </span>
                              {line.includes(':') && (
                                <span className="font-mono font-bold text-slate-700 shrink-0">{line.split(':')[1]}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Valor Estimado</span>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 font-mono align-super mr-0.5">R$</span>
                            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                              {calculatePriceBreakdown().total.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECURE PAYMENT METHOD SELECTOR */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Checkout Seguro</h4>
                            <p className="text-[8px] text-slate-400 font-medium font-mono">Zentex Instant Pay Integration</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {(['pix', 'credit', 'debit'] as const).map((method) => {
                            const isSel = selectedPayMethod === method;
                            return (
                              <button
                                type="button"
                                key={method}
                                onClick={() => setSelectedPayMethod(method)}
                                className={`py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                                  isSel
                                    ? 'bg-white border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-100'
                                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {method === 'pix' ? (
                                  <Smartphone className="w-4 h-4 shrink-0" />
                                ) : (
                                  <CreditCard className="w-4 h-4 shrink-0" />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-wider">
                                  {method === 'pix' ? 'Pix' : method === 'credit' ? 'Crédito' : 'Débito'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* PIX AREA */}
                        {selectedPayMethod === 'pix' && (
                          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 animate-fade-in text-center">
                            <div className="flex justify-center">
                              <div className="w-24 h-24 bg-white border border-slate-200 p-1.5 rounded-xl flex items-center justify-center relative">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                    `00020101021226850014br.gov.bcb.pix2563pix.zentex.com.br/qr/v2/payment/${currentUser.id}${calculatePriceBreakdown().total.toFixed(2)}`
                                  )}`} 
                                  alt="QR Code Pix"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 m-auto w-5 h-5 bg-emerald-600 rounded-md border-2 border-white flex items-center justify-center shadow-md">
                                  <span className="text-[7px] text-white font-black">Z</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-[10px] font-bold text-slate-800">Escaneie o QR Code ou copie o código</h5>
                              <button
                                type="button"
                                onClick={() => {
                                  const pixCode = `00020101021226850014br.gov.bcb.pix2563pix.zentex.com.br/qr/v2/payment/${currentUser.id}${calculatePriceBreakdown().total.toFixed(2)}`;
                                  navigator.clipboard.writeText(pixCode);
                                  setHasCopiedPix(true);
                                  setTimeout(() => setHasCopiedPix(false), 2000);
                                }}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {hasCopiedPix ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{hasCopiedPix ? 'Código Copiado!' : 'Copiar Chave Pix'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CARDS INPUTS */}
                        {(selectedPayMethod === 'credit' || selectedPayMethod === 'debit') && (
                          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 animate-fade-in">
                            {isIframe && efiPublicConfig && !efiPublicConfig.isSandbox && (
                              <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-xl text-left space-y-1 animate-fade-in mb-2.5">
                                <span className="text-indigo-800 font-extrabold text-[9px] uppercase tracking-wider block">🔒 Dica de Segurança (Iframe Detectado)</span>
                                <p className="text-[8px] text-indigo-750 leading-relaxed">
                                  Você está visualizando o app no painel integrado do AI Studio. Gateways seguros como a <strong>Efí Bank</strong> restringem a validação de cartões em iframes de terceiros.
                                </p>
                                <p className="text-[8px] text-indigo-900 font-bold leading-normal">
                                  👉 Para prosseguir com o pagamento por cartão de forma segura, abra o aplicativo em uma aba externa (clicando no botão de seta no canto superior direito do seu preview)!
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-2.5">
                              <div>
                                <label htmlFor="cardHolderName" className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Nome do Titular</label>
                                <input
                                  id="cardHolderName"
                                  name="cardHolderName"
                                  type="text"
                                  required
                                  autoComplete="cc-name"
                                  placeholder="NOME IMPRESSO NO CARTÃO"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label htmlFor="cardNumber" className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Número do Cartão</label>
                                <input
                                  id="cardNumber"
                                  name="cardNumber"
                                  type="text"
                                  required
                                  autoComplete="cc-number"
                                  maxLength={19}
                                  placeholder="NÚMERO DO CARTÃO"
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
                                    setCardNumber(formatted);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label htmlFor="cardExpiration" className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Validade</label>
                                  <input
                                    id="cardExpiration"
                                    name="cardExpiration"
                                    type="text"
                                    required
                                    autoComplete="cc-exp"
                                    maxLength={5}
                                    placeholder="MM/AA"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '');
                                      setCardExpiry(raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2, 4)}` : raw);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="cardCvv" className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">CVV</label>
                                  <input
                                    id="cardCvv"
                                    name="cardCvv"
                                    type="password"
                                    required
                                    autoComplete="cc-csc"
                                    maxLength={3}
                                    placeholder="CVV"
                                    value={cardCVV}
                                    onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>
                              <div>
                                <label htmlFor="docNumber" className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">CPF / CNPJ do Titular</label>
                                <input
                                  id="docNumber"
                                  name="docNumber"
                                  type="text"
                                  required
                                  autoComplete="off"
                                  placeholder="CPF OU CNPJ DO TITULAR DO CARTÃO"
                                  value={cardCpf}
                                  onChange={(e) => setCardCpf(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 focus:outline-none font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SANDBOX CONTROLS */}
                        {(selectedPayMethod === 'credit' || selectedPayMethod === 'debit') && (!efiPublicConfig || efiPublicConfig.isSandbox) && (
                          <div className="bg-amber-50/75 border border-amber-200/60 rounded-xl p-3 space-y-2 animate-fade-in text-left">
                            <span className="font-bold text-amber-800 uppercase text-[9px] tracking-wider block">⚙️ Simulação de Sandbox (Efí Bank)</span>
                            <p className="text-[10px] text-amber-700 leading-normal">Escolha o resultado desejado para testar seus fluxos de crédito/débito:</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSandboxSimulation('approved')}
                                className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  sandboxSimulation === 'approved'
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                Simular Autorização
                              </button>
                              <button
                                type="button"
                                onClick={() => setSandboxSimulation('declined')}
                                className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  sandboxSimulation === 'declined'
                                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                Simular Recusa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACTION SUBMIT BUTTON */}
                      <div className="pt-2">
                        {isPaying ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2.5">
                            <svg className="animate-spin h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider animate-pulse">
                              Efetuando Transação Segura Zentex...
                            </span>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-400 text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95 duration-150"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {!selectedPayMethod
                                ? 'Selecione a Forma de Pagamento'
                                : `Confirmar e Contratar • R$ ${calculatePriceBreakdown().total.toFixed(2).replace('.', ',')}`}
                            </span>
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS LIST & RADER TRACKING */}
      {activeTab === 'my-orders' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Histórico de Ordens de Serviço</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Acompanhe as solicitações que você já fez à Zentex.</p>
            </div>

            {clientOrders.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                  <Clipboard className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Nenhuma solicitação ainda</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Você ainda não enviou nenhum pedido de serviço. Use a aba "Pedir Serviço" acima para fazer sua primeira solicitação.</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pedir Meu Primeiro Serviço</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientOrders.map(order => {
                  const hasTechnician = !!order.assignedEmployeeId;
                  const isTrackable = order.status === 'em_andamento' || order.status === 'pausada';
                  
                  return (
                    <div 
                      key={order.id} 
                      className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">{order.id}</span>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-right">
                            {/* Priority badge */}
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              order.priority === 'alta' 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : order.priority === 'media' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {order.priority} Urgência
                            </span>

                            {/* Status badge */}
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border block mt-1.5 tracking-wider w-fit ml-auto ${
                              order.status === 'aberta' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                                : order.status === 'em_andamento'
                                ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                                : order.status === 'pausada'
                                ? 'bg-amber-500 text-white border-amber-600 font-bold'
                                : order.status === 'concluida'
                                ? 'bg-slate-100 text-slate-500 border-slate-200 font-bold'
                                : 'bg-rose-100 text-rose-700 border-rose-200'
                            }`}>
                              {order.status === 'aberta' ? 'Aguardando' : order.status === 'em_andamento' ? 'Técnico a Caminho' : order.status === 'pausada' ? 'Pausada' : order.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-800 leading-snug">{order.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{order.description}</p>
                        </div>

                        <div className="space-y-1.5 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="font-medium truncate">{order.clientAddress}</span>
                          </div>

                          {hasTechnician ? (
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/50">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <div>
                                <span className="text-slate-400 block text-[8px] uppercase tracking-wider leading-none">Técnico Designado</span>
                                <span className="font-bold text-slate-700 text-[10px]">{order.assignedEmployeeName}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/50">
                              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span className="text-amber-600 font-bold">Aguardando escalação do técnico...</span>
                            </div>
                          )}
                        </div>

                        {/* PAYMENT TRACKING INFO */}
                        {order.paymentStatus === 'pago' ? (
                          <div className="bg-emerald-50/50 border border-emerald-100/75 p-2.5 rounded-xl flex items-center justify-between text-[10px] mt-2 shadow-inner">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <span className="text-slate-400 block text-[8px] uppercase tracking-widest leading-none">Status do Pagamento</span>
                                <span className="font-extrabold text-emerald-800 font-mono text-[9px]">
                                  {order.price ? `Pago R$ ${order.price.toFixed(2).replace('.', ',')}` : 'Cortesia / Pago'}
                                  {order.paymentMethod && ` (${order.paymentMethod.toUpperCase()})`}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setShowReceiptOrder(order);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[8px] uppercase tracking-wider rounded-lg shadow-sm cursor-pointer transition-all shrink-0 flex items-center gap-1 hover:border-emerald-300"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>Recibo</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 border border-amber-100/75 p-2.5 rounded-xl flex items-center justify-between text-[10px] mt-2 shadow-inner">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div className="truncate">
                                <span className="text-slate-400 block text-[8px] uppercase tracking-widest leading-none">Status do Pagamento</span>
                                <span className="font-extrabold text-amber-850 font-mono text-[9px]">
                                  {order.price ? `Aguardando R$ ${order.price.toFixed(2).replace('.', ',')}` : 'Orçamento Pendente'}
                                </span>
                              </div>
                            </div>
                            
                            {order.price && order.price > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutOrder(order);
                                }}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[8px] uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all shrink-0 flex items-center gap-1 scale-102 hover:scale-105 active:scale-95 animate-pulse"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pagar Agora</span>
                              </button>
                            ) : (
                              <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase font-sans">
                                Faturamento
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* TRACKING ACTION FOOTER */}
                      {isTrackable && hasTechnician && (
                        <button
                          onClick={() => setTrackingOrder(order)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 duration-100 cursor-pointer border border-emerald-500/20"
                        >
                          <Map className="w-3.5 h-3.5" />
                          <span>Rastrear Técnico no Mapa</span>
                        </button>
                      )}

                      {order.status === 'concluida' && (
                        <div className="text-[10px] text-slate-500 italic bg-slate-100 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Serviço finalizado e inspecionado.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HIGH FIDELITY REAL-TIME RADAR MAP MODAL (TRACKING) */}
          {trackingOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
                
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Map className="w-5 h-5 text-emerald-600" />
                      <span>Rastreamento em Tempo Real via Satélite</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Zentex Radar operacional de acompanhamento</p>
                  </div>
                  <button 
                    onClick={() => setTrackingOrder(null)}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Radar visualization & Simulated Map */}
                <div className="p-6 space-y-4">
                  
                  {/* Informational tech panel */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl shadow-inner">
                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold block text-[8px]">Técnico de Campo</span>
                      <span className="text-xs font-black text-slate-800">{trackingOrder.assignedEmployeeName}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 uppercase font-bold block text-[8px]">Sinal GPS</span>
                      <span className="text-xs font-black text-emerald-600 uppercase flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>Excelente (Conectado)</span>
                      </span>
                    </div>

                    <div className="space-y-1 col-span-2 pt-2 border-t border-slate-200/50">
                      <span className="text-slate-400 uppercase font-bold block text-[8px]">Destino de Atendimento</span>
                      <span className="text-slate-700 font-medium truncate block">{trackingOrder.clientAddress}</span>
                    </div>
                  </div>

                  {/* Gorgeous simulated vector radar screen representing map */}
                  <div className="relative h-64 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    
                    {/* Simulated background grid & sonar scan ring */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
                    
                    {/* Sonar sweep line */}
                    <div className="absolute w-full h-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/15 to-emerald-500/0 animate-[spin_4s_linear_infinite] origin-center rounded-full pointer-events-none z-10" />

                    {/* Sonar rings */}
                    <div className="absolute w-12 h-12 border border-emerald-500/10 rounded-full" />
                    <div className="absolute w-24 h-24 border border-emerald-500/10 rounded-full" />
                    <div className="absolute w-40 h-40 border border-emerald-500/10 rounded-full" />
                    <div className="absolute w-56 h-56 border border-emerald-500/10 rounded-full" />

                    {/* Map Mock Locations */}
                    {/* 1. Client House (Center of Radar) */}
                    <div className="absolute flex flex-col items-center justify-center z-20">
                      <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="bg-slate-900/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-700 mt-1 uppercase tracking-wider">Você (Destino)</span>
                    </div>

                    {/* 2. Employee Position (Moving) */}
                    <div className="absolute top-1/4 left-1/3 flex flex-col items-center justify-center z-20 animate-pulse">
                      <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-emerald-300/40 shadow-lg relative">
                        <MapPin className="w-4 h-4 animate-bounce" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                      </div>
                      <span className="bg-emerald-900/90 text-emerald-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-700 mt-1 uppercase tracking-wider">Técnico</span>
                    </div>

                    {/* Simulated distance tracker */}
                    <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 text-slate-300 text-[9px] font-mono p-2 rounded-xl flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Distância estimada: <strong>1.4 km</strong> (~6 minutos)</span>
                    </div>
                  </div>

                  {/* Informational status updates footer */}
                  <div className="text-[11px] text-slate-500 leading-relaxed bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Nosso técnico está a caminho do seu endereço carregando todo o material necessário para realizar a limpeza e conservação contratada. Você pode ver atualizações adicionais clicando no chat abaixo.
                    </span>
                  </div>
                </div>

                {/* Footer with closed action */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setTrackingOrder(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Fechar Radar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL CORPORATE PAYMENT RECEIPT MODAL */}
          {showReceiptOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                
                {/* Receipt Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                    <Check className="w-6 h-6 text-emerald-100" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Recibo de Pagamento</h3>
                  <p className="text-[10px] text-emerald-200/90 font-mono mt-0.5">ZENTEX SERVIÇOS LTDA</p>
                </div>

                {/* Receipt Details */}
                <div className="p-6 space-y-4 font-sans text-slate-800">
                  <div className="text-center border-b border-slate-100 pb-3">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Valor Pago</span>
                    <span className="text-2xl font-black font-mono text-slate-800">
                      R$ {showReceiptOrder.price ? showReceiptOrder.price.toFixed(2).replace('.', ',') : '0,00'}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1 font-mono">ID Transação: TXN-{showReceiptOrder.id}-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cliente:</span>
                      <span className="font-bold text-slate-700">{showReceiptOrder.clientName}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Serviço Contratado:</span>
                      <span className="font-bold text-slate-700 text-right truncate max-w-[200px]" title={showReceiptOrder.title}>
                        {showReceiptOrder.title}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Meio de Pagamento:</span>
                      <span className="font-bold text-slate-700 uppercase">
                        {showReceiptOrder.paymentMethod ? (showReceiptOrder.paymentMethod === 'pix' ? 'Pix Instantâneo' : `Cartão de ${showReceiptOrder.paymentMethod === 'credit' ? 'Crédito' : 'Débito'}`) : 'Crédito Interno'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Data e Hora:</span>
                      <span className="font-mono text-slate-700">
                        {showReceiptOrder.paymentDate 
                          ? new Date(showReceiptOrder.paymentDate).toLocaleString('pt-BR') 
                          : new Date(showReceiptOrder.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Autenticação:</span>
                      <span className="font-mono text-[9px] text-emerald-600 font-bold uppercase">Aprovada & Liquidada via Gateway</span>
                    </div>
                  </div>

                  {/* Decorative dashed separator */}
                  <div className="border-t border-dashed border-slate-200 my-4" />

                  <div className="text-[9px] text-slate-400 text-center leading-relaxed">
                    Este documento serve como comprovante definitivo de pagamento eletrônico para os serviços de conservação prestados pela Zentex. 
                    Dúvidas ou suporte? Entre em contato pelo WhatsApp (11) 98888-7777 ou envie mensagem para nossa gerência.
                  </div>
                </div>

                {/* Receipt Footer Actions */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Imprimir Comprovante</span>
                  </button>
                  <button
                    onClick={() => setShowReceiptOrder(null)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REAL EFI BANK SECURE CHECKOUT MODAL */}
          {checkoutOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
              <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                
                {/* Secure Checkout Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 px-6 py-5 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-400/20 rounded-xl flex items-center justify-center">
                      <Lock className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider leading-none">Zentex Secure Pay</h3>
                      <span className="text-[8px] text-slate-400 block mt-1 font-mono uppercase">Gateway Homologado Efí Bank mTLS</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutOrder(null)}
                    disabled={checkoutLoading}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-all border border-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                  
                  {/* Checkout Success Screen */}
                  {checkoutSuccess ? (
                    <div className="text-center py-8 space-y-4 animate-scale-up">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                        <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">Pagamento Aprovado!</h4>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">Sua transação foi liquidada em tempo real com a Efí Bank. A ordem de serviço foi atualizada para "Paga".</p>
                      </div>
                      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/60 max-w-sm mx-auto">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Autenticação do Gateway</span>
                        <code className="text-[10px] font-mono text-emerald-800 font-extrabold block mt-0.5 truncate uppercase">
                          EFI-AUTH-{Math.floor(10000000 + Math.random() * 90000000)}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Service Order Recap Header */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-slate-400 block text-[8px] uppercase tracking-widest font-bold leading-none">Ordem de Serviço</span>
                          <span className="font-extrabold text-slate-800 text-xs block mt-1 truncate">#{checkoutOrder.id} - {checkoutOrder.title}</span>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{checkoutOrder.clientAddress}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-slate-400 block text-[8px] uppercase tracking-widest font-bold leading-none">Total</span>
                          <span className="font-mono font-black text-base text-slate-900 block mt-1">
                            R$ {checkoutOrder.price ? checkoutOrder.price.toFixed(2).replace('.', ',') : '0,00'}
                          </span>
                        </div>
                      </div>

                      {/* Environment Indicator */}
                      {efiPublicConfig && (
                        <div className={`rounded-xl px-3.5 py-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider ${efiPublicConfig.isSandbox ? 'bg-amber-50 text-amber-800 border border-amber-200/50' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${efiPublicConfig.isSandbox ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span>Gateway: {efiPublicConfig.isSandbox ? 'Modo de Testes (Sandbox/Homologação)' : 'Modo Real (Produção)'}</span>
                          </div>
                          <span>Efí Bank</span>
                        </div>
                      )}

                      {/* Payment Method Tabs */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => setCheckoutMethod('pix')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${checkoutMethod === 'pix' ? 'bg-white text-indigo-950 shadow-md border border-slate-200/30' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Pix Instantâneo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutMethod('card')}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${checkoutMethod === 'card' ? 'bg-white text-indigo-950 shadow-md border border-slate-200/30' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cartão de Crédito</span>
                        </button>
                      </div>

                      {/* TAB CONTENT: PIX PAY */}
                      {checkoutMethod === 'pix' && (
                        <div className="space-y-4">
                          
                          {checkoutLoading && !checkoutPixData && (
                            <div className="text-center py-8 space-y-3">
                              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-widest block">Gerando Pix Seguro na Efí Bank...</span>
                              <p className="text-[9px] text-slate-400">Estabelecendo canal criptografado mTLS de alta segurança.</p>
                            </div>
                          )}

                          {checkoutError && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2 text-left">
                              <span className="text-red-700 font-extrabold text-[10px] uppercase tracking-wider block">Erro na Integração do Pix</span>
                              <p className="text-[10px] text-red-650 leading-relaxed font-mono">{checkoutError}</p>
                              <button
                                onClick={() => {
                                  setCheckoutPixData(null);
                                  setCheckoutError(null);
                                  // Trigger retry by updating method
                                  setCheckoutMethod('pix');
                                }}
                                className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-300 text-[9px] uppercase cursor-pointer"
                              >
                                Tentar Novamente
                              </button>
                            </div>
                          )}

                          {checkoutPixData && (
                            <div className="space-y-4 animate-scale-up text-center">
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                                Pix Gerado via mTLS & Copia-e-Cola Ativo!
                              </span>

                              {/* QR Code Graphic Frame */}
                              <div className="relative w-44 h-44 bg-slate-50 border border-slate-200/80 rounded-3xl flex items-center justify-center mx-auto shadow-md overflow-hidden p-3 group">
                                {checkoutPixData.qrcodeImageBase64 ? (
                                  <img
                                    src={checkoutPixData.qrcodeImageBase64}
                                    alt="QR Code Pix"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-contain"
                                  />
                                ) : checkoutPixData.qrcodeImageUrl ? (
                                  <img
                                    src={checkoutPixData.qrcodeImageUrl}
                                    alt="QR Code Pix Demo"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-slate-400 text-center text-[10px]">
                                    <Image className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                                    <span>QR Code Indisponível</span>
                                  </div>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Abra o aplicativo de pagamentos do seu banco, escolha a opção <strong>"Pagar via Pix"</strong> e aponte a câmera para o QR Code acima, ou copie o código abaixo.
                              </p>

                              {/* Copy & Paste Code */}
                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Pix Copia e Cola</label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    readOnly
                                    value={checkoutPixData.pixCopiaECola}
                                    className="flex-1 bg-slate-50 border border-slate-200 font-mono text-[9px] rounded-xl px-3 py-2 text-slate-600 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(checkoutPixData.pixCopiaECola);
                                      setHasCopiedPix(true);
                                      setTimeout(() => setHasCopiedPix(false), 2000);
                                    }}
                                    className="px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0 text-[10px] font-bold"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{hasCopiedPix ? 'Copiado!' : 'Copiar'}</span>
                                  </button>
                                </div>
                              </div>

                              {checkoutPixData.isDemo && (
                                <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[9px] text-amber-800 text-left leading-relaxed">
                                  <strong>Atenção:</strong> Sandbox ativo para homologação técnica. O QR Code gerado é interativo e simula a API real do Banco Central com fins de demonstração.
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                                <span className="text-[9px] text-slate-400 font-mono">TXID: <strong className="text-slate-600">{checkoutPixData.txid.substring(0, 16)}...</strong></span>
                                <button
                                  type="button"
                                  onClick={handleConfirmPixPayment}
                                  disabled={checkoutLoading}
                                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 duration-150 shrink-0 flex items-center gap-1.5"
                                >
                                  {checkoutLoading ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>Já Realizei o Pagamento Pix</span>
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* TAB CONTENT: CREDIT CARD PAY */}
                      {checkoutMethod === 'card' && (
                        <form onSubmit={handleConfirmCardPayment} className="space-y-3 text-left">
                          
                          {isIframe && efiPublicConfig && !efiPublicConfig.isSandbox && (
                            <div className="bg-indigo-50 border border-indigo-150 p-3.5 rounded-2xl text-left space-y-1.5 animate-fade-in mb-2.5">
                              <span className="text-indigo-800 font-extrabold text-[10px] uppercase tracking-wider block">🔒 Dica de Segurança (Iframe Detectado)</span>
                              <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                                Você está visualizando a aplicação integrada no AI Studio. Gateways de pagamento seguro como a <strong>Efí Bank</strong> costumam bloquear a tokenização de cartões (CORS/Criptografia) se rodarem dentro de um iframe de terceiros.
                              </p>
                              <p className="text-[9px] text-indigo-900 font-bold leading-normal">
                                👉 Para realizar o pagamento com cartão com sucesso, por favor, abra este aplicativo em uma aba separada (clicando no botão de seta no canto superior direito do seu preview) e realize a operação!
                              </p>
                            </div>
                          )}
                          
                          {efiSdkStatus === 'missing_config' && (
                            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-left space-y-1.5 animate-fade-in">
                              <span className="text-amber-800 font-extrabold text-[10px] uppercase tracking-wider block">⚠️ Configuração de Cartão Pendente</span>
                              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                                O <strong>Identificador de Conta</strong> da Efí Bank (<code>EFI_ACCOUNT_CODE</code>) não está configurado nas variáveis de ambiente do seu servidor.
                              </p>
                              <p className="text-[9px] text-amber-600 leading-normal">
                                Para habilitar pagamentos reais com cartão de crédito, o proprietário deve cadastrar a credencial <strong>EFI_ACCOUNT_CODE</strong> nas configurações/segredos do painel do AI Studio ou do servidor de hospedagem.
                              </p>
                            </div>
                          )}

                          {efiSdkStatus === 'failed' && (
                            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-left space-y-1.5 animate-fade-in">
                              <span className="text-rose-800 font-extrabold text-[10px] uppercase tracking-wider block">⚠️ Bloqueio ou Erro de Carregamento</span>
                              <p className="text-[10px] text-rose-700 leading-relaxed font-medium">
                                Não foi possível carregar o módulo de segurança de criptografia de cartão da Efí Bank no seu navegador.
                              </p>
                              <p className="text-[9px] text-rose-600 leading-normal">
                                <strong>Possíveis causas:</strong> Bloqueadores de anúncios ativos (AdBlock), restrições de segurança do iframe do Google AI Studio, ou oscilações na rede da Efí.
                              </p>
                              <p className="text-[9px] text-indigo-700 leading-normal font-semibold">
                                👉 <strong>Como resolver:</strong> Desative o seu AdBlock para esta página, ou abra o aplicativo em uma nova aba fora do AI Studio (clicando no botão de seta no canto superior direito do preview) e tente novamente, ou utilize o pagamento Pix.
                              </p>
                            </div>
                          )}

                          {efiSdkStatus === 'loading' && (
                            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-left flex items-center gap-2.5 animate-pulse">
                              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
                              <div className="space-y-0.5">
                                <span className="text-indigo-800 font-bold text-[10px] uppercase tracking-wider block">Iniciando SDK de Segurança</span>
                                <p className="text-[9px] text-indigo-650 leading-normal font-medium">Verificando criptografia SSL ponta-a-ponta com a Efí Bank...</p>
                              </div>
                            </div>
                          )}

                          {checkoutError && (
                            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2 text-left animate-fade-in">
                              <span className="text-rose-700 font-extrabold text-[10px] uppercase tracking-wider block">Erro no Pagamento</span>
                              <p className="text-[10px] text-rose-650 leading-relaxed font-mono">{checkoutError}</p>
                              <button
                                type="button"
                                onClick={() => setCheckoutError(null)}
                                className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-300 text-[9px] uppercase cursor-pointer"
                              >
                                Entendi
                              </button>
                            </div>
                          )}

                          <div>
                            <label htmlFor="checkoutCardHolderName" className="text-[10px] font-bold text-slate-500 uppercase">Nome do Titular (conforme cartão)</label>
                            <input
                              id="checkoutCardHolderName"
                              name="cardHolderName"
                              type="text"
                              required
                              autoComplete="cc-name"
                              placeholder="Ex: JOAO S SILVA"
                              value={checkoutCardName}
                              onChange={(e) => setCheckoutCardName(e.target.value.toUpperCase())}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                            />
                          </div>

                          <div>
                            <label htmlFor="checkoutCardNumber" className="text-[10px] font-bold text-slate-500 uppercase">Número do Cartão</label>
                            <div className="relative mt-1">
                              <input
                                id="checkoutCardNumber"
                                name="cardNumber"
                                type="text"
                                required
                                autoComplete="cc-number"
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                value={checkoutCardNumber}
                                onChange={(e) => setCheckoutCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner font-mono"
                              />
                              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="checkoutCardExpiration" className="text-[10px] font-bold text-slate-500 uppercase">Validade (MM/AA)</label>
                              <input
                                id="checkoutCardExpiration"
                                name="cardExpiration"
                                type="text"
                                required
                                autoComplete="cc-exp"
                                placeholder="Ex: 12/29"
                                maxLength={5}
                                value={checkoutCardExpiry}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                  setCheckoutCardExpiry(val);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner font-mono"
                              />
                            </div>
                            <div>
                              <label htmlFor="checkoutCardCvv" className="text-[10px] font-bold text-slate-500 uppercase">CVC / Código de Segurança</label>
                              <input
                                id="checkoutCardCvv"
                                name="cardCvv"
                                type="password"
                                required
                                autoComplete="cc-csc"
                                maxLength={4}
                                placeholder="Ex: 123"
                                value={checkoutCardCVV}
                                onChange={(e) => setCheckoutCardCVV(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="checkoutDocNumber" className="text-[10px] font-bold text-slate-500 uppercase">CPF / CNPJ do Titular</label>
                              <input
                                id="checkoutDocNumber"
                                name="docNumber"
                                type="text"
                                required
                                autoComplete="off"
                                placeholder="Ex: 000.000.000-00"
                                value={checkoutCardCpf}
                                onChange={(e) => setCheckoutCardCpf(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner font-mono"
                              />
                            </div>
                            <div>
                              <label htmlFor="checkoutReceiptEmail" className="text-[10px] font-bold text-slate-500 uppercase">E-mail para Recibo</label>
                              <input
                                id="checkoutReceiptEmail"
                                name="receiptEmail"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="Ex: joao@email.com"
                                value={checkoutCardEmail}
                                onChange={(e) => setCheckoutCardEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 mt-1 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                              />
                            </div>
                          </div>

                          {(!efiPublicConfig || efiPublicConfig.isSandbox) && (
                            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 space-y-2 animate-fade-in text-left">
                              <span className="font-bold text-amber-800 uppercase text-[9px] tracking-wider block">⚙️ Simulação de Sandbox (Efí Bank)</span>
                              <p className="text-[10px] text-amber-700 leading-normal">Escolha o resultado desejado para testar seus fluxos de crédito/débito:</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSandboxSimulation('approved')}
                                  className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                    sandboxSimulation === 'approved'
                                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  Simular Autorização
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSandboxSimulation('declined')}
                                  className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                    sandboxSimulation === 'declined'
                                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  Simular Recusa
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                            <span className="text-[9px] text-slate-400 block leading-none flex items-center gap-1 font-mono uppercase">
                              <Lock className="w-3 h-3 text-slate-400" /> Criptografia SSL AES-256
                            </span>
                            <button
                              type="submit"
                              disabled={checkoutLoading}
                              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 duration-150 shrink-0 flex items-center gap-1.5"
                            >
                              {checkoutLoading ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <CreditCard className="w-3.5 h-3.5" />
                              )}
                              <span>Autorizar Transação de R$ {checkoutOrder.price ? checkoutOrder.price.toFixed(2).replace('.', ',') : '0,00'}</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHAT SUPPORT */}
      {activeTab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm max-w-3xl mx-auto flex flex-col h-[550px]">
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Atendimento ao Cliente Zentex</h3>
              <p className="text-[10px] text-slate-400 font-medium">Tire suas dúvidas instantaneamente ou envie instruções operacionais para os gerentes.</p>
            </div>
          </div>

          {/* Interactive Chat Mode Toggle Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200">
            <button 
              type="button"
              onClick={() => setChatMode('bot')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                chatMode === 'bot' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>🤖 Zentex Bot (Virtual)</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setChatMode('manager');
                setTimeout(() => {
                  const container = document.getElementById('client-chat-scroll');
                  if (container) container.scrollTop = container.scrollHeight;
                }, 100);
              }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                chatMode === 'manager' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>💬 Suporte (Gerência)</span>
            </button>
          </div>

          {/* Messages Area */}
          <div 
            id={chatMode === 'bot' ? 'bot-chat-scroll' : 'client-chat-scroll'}
            className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl shadow-inner min-h-0"
          >
            {chatMode === 'bot' ? (
              botMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-sm shrink-0">
                        Z
                      </div>
                    )}
                    
                    <div className="max-w-[85%] space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold block ml-1.5 uppercase">
                        {isMe ? 'Você' : 'Zentex Bot (Virtual)'}
                      </span>
                      <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono block text-right pr-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : clientChatMessages.length === 0 ? (
              <div className="text-center py-16 space-y-2.5">
                <span className="text-[10px] bg-emerald-100/50 text-emerald-800 px-3 py-1 rounded-full font-black uppercase tracking-wider">Suporte Direto</span>
                <h4 className="text-xs font-bold text-slate-650">Alguma dúvida ou instrução especial?</h4>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Envie uma mensagem abaixo e ela será repassada diretamente à nossa gerência para ajudá-lo.</p>
              </div>
            ) : (
              clientChatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm shrink-0">
                        Z
                      </div>
                    )}
                    
                    <div className="max-w-[80%] space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold block ml-1.5 uppercase">
                        {isMe ? 'Você' : `${msg.senderName} (Suporte)`}
                      </span>
                      <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono block text-right pr-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Simulated Bot Typing Indicator */}
            {chatMode === 'bot' && isBotTyping && (
              <div className="flex justify-start items-end gap-2 animate-pulse">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-sm shrink-0">
                  Z
                </div>
                <div className="max-w-[80%] space-y-0.5">
                  <span className="text-[8px] text-slate-400 font-bold block ml-1.5 uppercase">Zentex Bot</span>
                  <div className="bg-white text-slate-500 border border-slate-200/85 p-3 rounded-2xl rounded-bl-none text-[10px] shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Support FAQ Helper Chips (Only on Bot mode) */}
          {chatMode === 'bot' && (
            <div className="flex flex-wrap gap-1.5 mt-3 px-1">
              <button
                type="button"
                onClick={() => handleBotResponse('Quais são os pacotes de serviços e preços fixos?')}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-black px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                📦 Ver Pacotes & Preços
              </button>
              <button
                type="button"
                onClick={() => handleBotResponse('Como funciona o rastreamento do técnico?')}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-black px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                📡 Como rastrear o Técnico?
              </button>
              <button
                type="button"
                onClick={() => handleBotResponse('Como posso redefinir ou alterar meu cadastro?')}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-black px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                ⚙️ Como editar meu Cadastro?
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatMode('manager');
                  setTimeout(() => {
                    const container = document.getElementById('client-chat-scroll');
                    if (container) container.scrollTop = container.scrollHeight;
                  }, 100);
                }}
                className="text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                👤 Falar com Humano
              </button>
            </div>
          )}

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatText.trim()) return;
              if (chatMode === 'bot') {
                const textToSend = chatText.trim();
                setChatText('');
                handleBotResponse(textToSend);
              } else {
                handleSendChat(e);
              }
            }} 
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              placeholder={chatMode === 'bot' ? "Digite uma dúvida sobre pacotes, valores, rastreamento..." : "Digite sua mensagem para a gerência humana..."}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 duration-150 shrink-0"
              title="Enviar Mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* TAB 4: PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Dados do Meu Cadastro</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Atualize seus dados pessoais e de contato para facilitar os agendamentos operacionais.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-2xl">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs animate-pulse">
                Cadastro atualizado com sucesso!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profileFullName" className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
                <input
                  id="profileFullName"
                  name="profileFullName"
                  type="text"
                  required
                  autoComplete="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label htmlFor="profileEmail" className="text-[10px] font-bold text-slate-500 uppercase">E-mail (Login)</label>
                <input
                  id="profileEmail"
                  name="profileEmail"
                  type="email"
                  disabled
                  autoComplete="email"
                  value={currentUser.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 mt-1 font-mono focus:outline-none"
                  title="Não é possível alterar o e-mail de acesso."
                />
              </div>

              <div>
                <label htmlFor="profilePhone" className="text-[10px] font-bold text-slate-500 uppercase">Celular / WhatsApp *</label>
                <input
                  id="profilePhone"
                  name="profilePhone"
                  type="text"
                  required
                  autoComplete="tel"
                  placeholder="Ex: (11) 99999-8888"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label htmlFor="profileAvatar" className="text-[10px] font-bold text-slate-500 uppercase">Foto do Perfil (URL)</label>
                <input
                  id="profileAvatar"
                  name="profileAvatar"
                  type="text"
                  placeholder="URL da foto..."
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="profileAddress" className="text-[10px] font-bold text-slate-500 uppercase">Endereço Residencial / Corporativo Principal *</label>
                <input
                  id="profileAddress"
                  name="profileAddress"
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="Ex: Alameda Lorena, 1200 - Jardins, São Paulo - SP"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 mt-1 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Este endereço servirá como padrão ao fazer novas solicitações.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 duration-150"
              >
                Salvar Alterações
              </button>

              <div className="text-right text-[9px] text-slate-400">
                <span>Tipo de Acesso: <strong>Cliente Zentex</strong></span>
                <span className="block mt-0.5">ID: <code className="font-mono">{currentUser.id}</code></span>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
