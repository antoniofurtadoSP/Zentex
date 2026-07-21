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

    // 1. Se o SDK já estiver disponível e pronto, resolve imediatamente
    if (typeof win.$gn !== 'undefined' && typeof win.$gn.ready === 'function') {
      const activeAccountCode = efiPublicConfig?.accountCode || accountHash || '3931688641e8e06302526275df0fada3';
      try {
        win.$gn.setAccount(activeAccountCode);
      } catch (err) {
        console.error('[Efí SDK Utils] Erro ao chamar setAccount em SDK já pronto:', err);
      }
      resolve();
      return;
    }

    // Determine se é sandbox ou produção
    const isSandboxEnv = efiPublicConfig
      ? efiPublicConfig.isSandbox
      : ((win.process?.env?.VITE_EFI_SANDBOX === 'true' || win.process?.env?.VITE_EFI_SANDBOX === true) || false);

    const targetSrc = isSandboxEnv
      ? 'https://sandbox.gerencianet.com.br/v1/cdn'
      : 'https://api.gerencianet.com.br/v1/cdn';

    const scriptId = 'efi-payment-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const activeAccountCode = efiPublicConfig?.accountCode || accountHash || '3931688641e8e06302526275df0fada3';

    if (script) {
      if (script.src === targetSrc) {
        if (typeof win.$gn !== 'undefined' && typeof win.$gn.ready === 'function') {
          try {
            win.$gn.setAccount(activeAccountCode);
          } catch (err) {
            console.error('[Efí SDK Utils] Erro ao configurar setAccount:', err);
          }
          resolve();
          return;
        }

        // Se o script já existe mas ainda está carregando, acopla no onload existente
        const prevOnload = script.onload;
        script.onload = (e) => {
          if (prevOnload) (prevOnload as any)(e);
          if (win.$gn) {
            try {
              win.$gn.setAccount(activeAccountCode);
              console.log('[Efí SDK Utils] Chave Account Hash configurada via onload acoplado:', activeAccountCode);
            } catch (err) {
              console.error('[Efí SDK Utils] Erro ao configurar setAccount no onload:', err);
            }
          }
          resolve();
        };
        script.onerror = () => {
          reject(new Error('Falha ao baixar o script de segurança do Efí Bank'));
        };
        return;
      } else {
        // Remove script de ambiente incorreto
        script.remove();
      }
    }

    // Cria e insere o script dinamicamente
    const newScript = document.createElement('script');
    newScript.id = scriptId;
    newScript.type = 'text/javascript';
    newScript.src = targetSrc;
    newScript.async = true;

    newScript.onload = () => {
      console.log(`[Efí Bank Utils] SDK carregado com sucesso (${isSandboxEnv ? 'Sandbox' : 'Produção'})`);
      if (win.$gn) {
        try {
          win.$gn.setAccount(activeAccountCode);
          console.log('[Efí SDK Utils] Chave Account Hash configurada:', activeAccountCode);
        } catch (err) {
          console.error('[Efí SDK Utils] Erro ao chamar setAccount no onload:', err);
        }
      }
      resolve();
    };

    newScript.onerror = (err) => {
      console.error('[Efí Bank Utils] Erro crítico ao baixar script do SDK:', err);
      reject(new Error('Falha ao baixar o script de segurança do Efí Bank'));
    };

    document.head.appendChild(newScript);
  });
};
