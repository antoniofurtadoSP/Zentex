/**
 * Utilitário para carregamento dinâmico e seguro do SDK da Efí Bank (payment-token-efi).
 */

interface EfiPublicConfig {
  accountCode: string;
  isSandbox: boolean;
  hasCardConfig?: boolean;
  hasConfig?: boolean;
}

export const loadEfiSdk = (
  accountHash: string,
  efiPublicConfig?: EfiPublicConfig | null
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const win = window as any;

    if (win.EfiJs) {
      return resolve();
    }

    const scriptId = 'efi-payment-token-script';
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi.min.js';

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.async = true;
      script.src = cdnUrl;
      document.head.appendChild(script);
    }

    script.onload = () => {
      if (win.EfiJs) {
        console.log('[Efí SDK Utils] Biblioteca EfiJs carregada com sucesso!');
        resolve();
      } else {
        reject(new Error('Biblioteca EfiJs não encontrada após carregar o script.'));
      }
    };

    script.onerror = () => {
      console.error('[Efí SDK Utils] Erro ao carregar biblioteca js-payment-token-efi');
      reject(new Error('Falha ao baixar o script de segurança do Efí Bank'));
    };

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (win.EfiJs) {
        clearInterval(interval);
        resolve();
      } else if (attempts > 25) {
        clearInterval(interval);
        if (!win.EfiJs) {
          reject(new Error('Não foi possível carregar o módulo de segurança da Efí Bank a tempo.'));
        }
      }
    }, 300);
  });
};
