export type Role = 'admin' | 'employee';

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
