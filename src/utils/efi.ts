/**
 * Utilitário para carregamento dinâmico e seguro do SDK da Efí Bank.
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

    const timeoutId = setTimeout(() => {
      console.warn('[Efí SDK Utils] Timeout ao baixar ou inicializar o script do Efí Bank.');
      reject(new Error('Falha ao baixar o script de segurança do Efí Bank'));
    }, 8000);

    const safeResolve = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    const safeReject = (err: Error) => {
      clearTimeout(timeoutId);
      reject(err);
    };

    // 1. Se o SDK já estiver disponível e pronto, resolve imediatamente
    if (typeof win.$gn !== 'undefined' && typeof win.$gn.ready === 'function') {
      const activeAccountCode = efiPublicConfig?.accountCode || accountHash || '3931688641e8e06302526275df0fada3';
      try {
        win.$gn.setAccount(activeAccountCode);
      } catch (err) {
        console.error('[Efí SDK Utils] Erro ao chamar setAccount em SDK já pronto:', err);
      }
      safeResolve();
      return;
    }

    // Determine se é sandbox ou produção
    const isSandboxEnv = efiPublicConfig
      ? efiPublicConfig.isSandbox
      : ((win.process?.env?.VITE_EFI_SANDBOX === 'true' || win.process?.env?.VITE_EFI_SANDBOX === true) || false);

    const activeAccountCode = efiPublicConfig?.accountCode || accountHash || '3931688641e8e06302526275df0fada3';

    // 1ª Tentativa: Produção / 2ª Tentativa (Fallback): Sandbox
    const urls = [
      'https://api.gerencianet.com.br/v1/cdn',
      'https://sandbox.gerencianet.com.br/v1/cdn'
    ];

    const tryLoad = (index: number) => {
      if (index >= urls.length) {
        console.error('[Efí Bank Utils] Todas as tentativas de baixar o SDK do Efí Bank falharam de forma crítica.');
        safeReject(new Error('Falha ao baixar o script de segurança do Efí Bank'));
        return;
      }

      const currentUrl = urls[index];
      const scriptId = 'efi-payment-sdk';

      // Remove script anterior caso exista
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }

      console.log(`[Efí Bank Utils] Tentando baixar SDK do Efí Bank de: ${currentUrl}`);

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.async = true;
      script.src = currentUrl;

      script.onload = () => {
        console.log(`[Efí Bank Utils] SDK carregado com sucesso a partir de: ${currentUrl}`);
        if (win.$gn) {
          try {
            win.$gn.setAccount(activeAccountCode);
            console.log('[Efí SDK Utils] Chave Account Hash configurada com sucesso:', activeAccountCode);
          } catch (err) {
            console.error('[Efí SDK Utils] Erro ao chamar setAccount no onload do script carregado:', err);
          }
        }
        safeResolve();
      };

      script.onerror = () => {
        console.error('[Efí SDK] Erro de rede/CORS ao tentar baixar o script:', script.src);
        // Tenta o próximo link de fallback da lista
        tryLoad(index + 1);
      };

      document.head.appendChild(script);
    };

    tryLoad(0);
  });
};
