import https from 'https';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Lazy loading client/config to prevent crashing on boot if envs are missing
export interface EfiConfig {
  clientId: string;
  clientSecret: string;
  pixKey: string;
  certPath?: string; // Path to .p12 certificate file
  certBase64?: string; // Base64 encoded .p12 certificate
  certPassword?: string; // Optional password for .p12
  isSandbox: boolean;
}

export function getEfiConfig(): EfiConfig | null {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  const pixKey = process.env.EFI_PIX_KEY;
  const certPath = process.env.EFI_CERT_PATH;
  const certBase64 = process.env.EFI_CERT_BASE64;
  const certPassword = process.env.EFI_CERT_PASSWORD || '';
  const isSandbox = process.env.EFI_SANDBOX !== 'false'; // defaults to true for safety

  if (!clientId || !clientSecret || !pixKey) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    pixKey,
    certPath,
    certBase64,
    certPassword,
    isSandbox,
  };
}

/**
 * Generates an HTTPS Agent configured with the Efí P12 certificate
 */
function getHttpsAgent(config: EfiConfig): https.Agent {
  let pfx: Buffer;

  if (config.certBase64) {
    try {
      pfx = Buffer.from(config.certBase64, 'base64');
    } catch (e: any) {
      throw new Error(`Falha ao decodificar certificado Efí Bank da variável EFI_CERT_BASE64: ${e.message}`);
    }
  } else {
    if (!config.certPath) {
      throw new Error('Caminho do certificado Efí Bank (.p12) ou EFI_CERT_BASE64 não configurado.');
    }

    const resolvedPath = path.isAbsolute(config.certPath)
      ? config.certPath
      : path.join(process.cwd(), config.certPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Arquivo de certificado Efí Bank não encontrado no caminho: ${resolvedPath}`);
    }

    pfx = fs.readFileSync(resolvedPath);
  }

  return new https.Agent({
    pfx,
    passphrase: config.certPassword,
    rejectUnauthorized: false // can be true in production, false for self-signed certificates
  });
}

/**
 * Gets the base API URL for Efí Bank
 */
function getBaseUrl(isSandbox: boolean, isPix: boolean = true): string {
  if (isPix) {
    return isSandbox 
      ? 'https://pix-h.api.efipay.com.br' 
      : 'https://pix.api.efipay.com.br';
  } else {
    return isSandbox
      ? 'https://homologacao.gerencianet.com.br'
      : 'https://api.gerencianet.com.br';
  }
}

/**
 * Step 1: OAuth token generation with Efí Bank (using mTLS for Pix)
 */
async function getPixAccessToken(config: EfiConfig): Promise<string> {
  const baseUrl = getBaseUrl(config.isSandbox, true);
  const agent = getHttpsAgent(config);

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await axios({
      method: 'POST',
      url: `${baseUrl}/oauth/token`,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      data: {
        grant_type: 'client_credentials'
      },
      httpsAgent: agent
    });

    return response.data.access_token;
  } catch (error: any) {
    console.error('Erro de autenticação na Efí Bank (Pix OAuth):', error.response?.data || error.message);
    throw new Error(`Falha ao autenticar na Efí Bank: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Step 2 & 3: Creates an immediate Pix charge and returns the copy-and-paste string and QR Code image
 */
export async function createPixPayment(amount: number, orderId: string, clientName: string, clientCpfOrCnpj?: string) {
  const config = getEfiConfig();
  if (!config) {
    throw new Error('EFI_CREDENTIALS_MISSING');
  }

  const token = await getPixAccessToken(config);
  const baseUrl = getBaseUrl(config.isSandbox, true);
  const agent = getHttpsAgent(config);

  // Format amount to 2 decimal places string
  const formattedAmount = amount.toFixed(2);

  // Build devedor dynamically - must have CPF or CNPJ if provided to Efí Pix API
  const devedorPayload: any = {};
  if (clientName) {
    devedorPayload.nome = clientName.substring(0, 80);
  }

  if (clientCpfOrCnpj) {
    const cleanCpfOrCnpj = clientCpfOrCnpj.replace(/\D/g, '');
    if (cleanCpfOrCnpj.length === 11) {
      devedorPayload.cpf = cleanCpfOrCnpj;
    } else if (cleanCpfOrCnpj.length === 14) {
      devedorPayload.cnpj = cleanCpfOrCnpj;
    }
  }

  const hasValidTaxId = !!(devedorPayload.cpf || devedorPayload.cnpj);

  try {
    // 1. Create immediate charge (cobrança imediata)
    const chargeResponse = await axios({
      method: 'POST',
      url: `${baseUrl}/v2/cob`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        calendario: {
          expiracao: 3600 // 1 hour
        },
        ...(hasValidTaxId ? { devedor: devedorPayload } : {}),
        valor: {
          original: formattedAmount
        },
        chave: config.pixKey,
        solicitacaoPagador: `Zentex OS #${orderId}`
      },
      httpsAgent: agent
    });

    const locId = chargeResponse.data.loc?.id;
    if (!locId) {
      throw new Error('ID de localização Pix não retornado pela Efí Bank');
    }

    // 2. Fetch the QR Code using the location ID
    const qrcodeResponse = await axios({
      method: 'GET',
      url: `${baseUrl}/v2/loc/${locId}/qrcode`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      httpsAgent: agent
    });

    return {
      pixCopiaECola: qrcodeResponse.data.qrcode,
      qrcodeImageBase64: qrcodeResponse.data.imagemQrcode, // base64 PNG image
      txid: chargeResponse.data.txid,
      locId
    };
  } catch (error: any) {
    console.error('Erro ao gerar cobrança Pix na Efí Bank:', error.response?.data || error.message);
    throw new Error(`Falha ao criar cobrança Pix: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Step 1: OAuth token generation for Card transactions (Standard, no certificate required)
 */
async function getCardAccessToken(config: EfiConfig): Promise<string> {
  const baseUrl = getBaseUrl(config.isSandbox, false);
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await axios({
      method: 'POST',
      url: `${baseUrl}/v1/authorize`,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      data: {
        grant_type: 'client_credentials'
      }
    });

    return response.data.access_token;
  } catch (error: any) {
    console.error('Erro de autenticação na Efí Bank (Card OAuth):', error.response?.data || error.message);
    throw new Error(`Falha ao autenticar na Efí Bank (Card): ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Creates a Credit or Debit Card charge using Efí Bank
 */
export async function createCardPayment(params: {
  amount: number;
  orderId: string;
  cardToken: string;
  clientName: string;
  clientEmail: string;
  clientCpf: string;
  installments?: number;
}) {
  const config = getEfiConfig();
  if (!config) {
    throw new Error('EFI_CREDENTIALS_MISSING');
  }

  const token = await getCardAccessToken(config);
  const baseUrl = getBaseUrl(config.isSandbox, false);

  // Convert amount to cents (integer) for credit card transactions
  const amountInCents = Math.round(params.amount * 100);

  try {
    const response = await axios({
      method: 'POST',
      url: `${baseUrl}/v1/charge`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        items: [
          {
            name: `Serviço Zentex OS #${params.orderId}`,
            value: amountInCents,
            amount: 1
          }
        ]
      }
    });

    const chargeId = response.data.data?.charge_id;
    if (!chargeId) {
      throw new Error('ID da cobrança não retornado pela Efí Bank');
    }

    // Associate the credit card payment details with the charge
    const paymentResponse = await axios({
      method: 'POST',
      url: `${baseUrl}/v1/charge/${chargeId}/pay`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        payment: {
          credit_card: {
            installments: params.installments || 1,
            payment_token: params.cardToken,
            billing_address: {
              street: 'Rua Exemplo',
              number: '123',
              neighborhood: 'Centro',
              zipcode: '01001000',
              city: 'São Paulo',
              state: 'SP'
            },
            customer: {
              name: params.clientName,
              email: params.clientEmail,
              cpf: params.clientCpf.replace(/\D/g, ''),
              phone_number: '11988887777'
            }
          }
        }
      }
    });

    return {
      success: paymentResponse.data.code === 200,
      chargeId,
      status: paymentResponse.data.data?.status,
      paymentMethod: 'credit_card'
    };
  } catch (error: any) {
    console.error('Erro ao processar pagamento por cartão na Efí Bank:', error.response?.data || error.message);
    throw new Error(`Falha no pagamento com cartão: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}
