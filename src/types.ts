export type Role = 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  status: 'working' | 'idle' | 'offline'; // working = on duty, active activity; idle = on duty, but no active task; offline = off duty
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationUpdate?: string;
  password?: string;
  isTemporaryPassword?: boolean;
  address?: string;         // Endereço Residencial
  documentId?: string;      // CPF ou RG
  birthDate?: string;       // Data de Nascimento
  admissionDate?: string;   // Data de Admissão
  notes?: string;           // Observações/Anotações internas
  gender?: 'male' | 'female' | 'neutral'; // Gênero: masculino, feminino, neutro
}

export type OSStatus = 'aberta' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada';
export type OSPriority = 'baixa' | 'media' | 'alta';

export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  priority: OSPriority;
  status: OSStatus;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  pauseReason?: string;
  completionNotes?: string;
  completionSignature?: string; // Base64 drawing or name confirmation
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  price?: number;
  paymentStatus?: 'pendente' | 'pago' | 'reembolsado';
  paymentMethod?: 'cartao_credito' | 'cartao_debito' | 'pix';
  paymentDate?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  receiverId?: string; // if omitted, is general channel
  text: string;
  timestamp: string;
}

export interface TimeCard {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM:SS
  clockOut?: string; // HH:MM:SS
  latitudeIn?: number;
  longitudeIn?: number;
  latitudeOut?: number;
  longitudeOut?: number;
}
