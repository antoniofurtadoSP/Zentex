import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { User, ServiceOrder, ChatMessage, TimeCard } from './src/types';

// ES Module resolutions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(__dirname, 'data.json');

// Default Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Antonio Claudio',
    email: 'antonio@zentex.com',
    role: 'admin',
    phone: '(11) 98888-1111',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'working'
  },
  {
    id: 'emp1',
    name: 'Lucas Silva',
    email: 'lucas@zentex.com',
    role: 'employee',
    phone: '(11) 97777-2222',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'working',
    lastLatitude: -23.5616,
    lastLongitude: -46.6560,
    lastLocationUpdate: new Date().toISOString()
  },
  {
    id: 'emp2',
    name: 'Mariana Costa',
    email: 'mariana@zentex.com',
    role: 'employee',
    phone: '(11) 96666-3333',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'idle',
    lastLatitude: -23.5580,
    lastLongitude: -46.6620,
    lastLocationUpdate: new Date().toISOString()
  },
  {
    id: 'emp3',
    name: 'Roberto Santos',
    email: 'roberto@zentex.com',
    role: 'employee',
    phone: '(11) 95555-4444',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
    lastLatitude: -23.5530,
    lastLongitude: -46.6500,
    lastLocationUpdate: new Date().toISOString()
  }
];

const DEFAULT_ORDERS: ServiceOrder[] = [
  {
    id: 'OS-1001',
    title: 'Manutenção de Ar Condicionado',
    description: 'Aparelho de ar condicionado central não está resfriando e apresenta ruídos no setor de atendimento principal.',
    clientName: 'Banco Itaú - Agência Paulista',
    clientAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    clientPhone: '(11) 3251-1234',
    priority: 'alta',
    status: 'em_andamento',
    assignedEmployeeId: 'emp1',
    assignedEmployeeName: 'Lucas Silva',
    createdBy: 'admin1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    startLatitude: -23.5620,
    startLongitude: -46.6550
  },
  {
    id: 'OS-1002',
    title: 'Instalação de Roteador Wi-Fi 6',
    description: 'Instalar e configurar o novo roteador corporativo de alta performance fornecido no almoxarifado.',
    clientName: 'Clínica Médica Bem Estar',
    clientAddress: 'Rua Augusta, 1500 - Consolação, São Paulo - SP',
    clientPhone: '(11) 3881-5555',
    priority: 'media',
    status: 'aberta',
    createdBy: 'admin1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'OS-1003',
    title: 'Reparo de Cabeamento de Rede Cat6',
    description: 'Substituição de tomadas RJ45 fêmea no laboratório de informática. Alguns pontos estão sem sinal ou lentos.',
    clientName: 'Escola Maple Bear Jardins',
    clientAddress: 'Alameda Lorena, 800 - Jardins, São Paulo - SP',
    clientPhone: '(11) 3062-8888',
    priority: 'alta',
    status: 'pausada',
    assignedEmployeeId: 'emp2',
    assignedEmployeeName: 'Mariana Costa',
    createdBy: 'admin1',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    pausedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    pauseReason: 'Falta de conector fêmea Cat6 de reposição'
  },
  {
    id: 'OS-1004',
    title: 'Substituição de Câmera Dome Externa',
    description: 'Troca da câmera danificada por curto na entrada da garagem. Testar o sinal com o gravador DVR.',
    clientName: 'Condomínio Edifício Copan',
    clientAddress: 'Av. Ipiranga, 200 - Centro Histórico de São Paulo, São Paulo - SP',
    clientPhone: '(11) 3259-2200',
    priority: 'baixa',
    status: 'concluida',
    assignedEmployeeId: 'emp3',
    assignedEmployeeName: 'Roberto Santos',
    createdBy: 'admin1',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    completionNotes: 'Câmera instalada com sucesso, sinal verificado no monitor de vigilância.',
    completionSignature: 'Roberto Santos & Síndico',
    startLatitude: -23.5430,
    startLongitude: -46.6440,
    endLatitude: -23.5431,
    endLongitude: -46.6439
  }
];

const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: 'chat1',
    senderId: 'emp1',
    senderName: 'Lucas Silva',
    senderRole: 'employee',
    text: 'Olá! Acabei de chegar no Banco Itaú na Paulista para iniciar a manutenção do ar condicionado.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'chat2',
    senderId: 'admin1',
    senderName: 'Antonio Claudio',
    senderRole: 'admin',
    text: 'Perfeito, Lucas. Verifique também a tubulação traseira para ver se há algum vazamento de gás.',
    timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'chat3',
    senderId: 'emp1',
    senderName: 'Lucas Silva',
    senderRole: 'employee',
    text: 'Ok, vou olhar e aviso se precisar de reposição.',
    timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'chat4',
    senderId: 'emp2',
    senderName: 'Mariana Costa',
    senderRole: 'employee',
    text: 'Preciso de conectores Cat6 adicionais para concluir o laboratório da Maple Bear. Tem no estoque?',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'chat5',
    senderId: 'admin1',
    senderName: 'Antonio Claudio',
    senderRole: 'admin',
    text: 'Sim, temos sim, Mariana. Estão no armário B do almoxarifado. Pode vir retirar.',
    timestamp: new Date(Date.now() - 7.8 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_TIMECARDS: TimeCard[] = [
  {
    id: 'tc1',
    employeeId: 'emp1',
    employeeName: 'Lucas Silva',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:05:22',
    latitudeIn: -23.5600,
    longitudeIn: -46.6500
  },
  {
    id: 'tc2',
    employeeId: 'emp2',
    employeeName: 'Mariana Costa',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:15:45',
    latitudeIn: -23.5550,
    longitudeIn: -46.6600
  }
];

interface DB {
  users: User[];
  orders: ServiceOrder[];
  chats: ChatMessage[];
  timecards: TimeCard[];
}

function loadDB(): DB {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to parse database file, falling back to seeds.', error);
  }
  
  const initial: DB = {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    chats: DEFAULT_CHATS,
    timecards: DEFAULT_TIMECARDS
  };
  saveDB(initial);
  return initial;
}

function saveDB(db: DB) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database file.', error);
  }
}

// REST API Endpoints
app.get('/api/data', (req, res) => {
  const db = loadDB();
  res.json(db);
});

// Reset database to default mock seed data
app.post('/api/reset', (req, res) => {
  const initial: DB = {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    chats: DEFAULT_CHATS,
    timecards: DEFAULT_TIMECARDS
  };
  saveDB(initial);
  res.json({ success: true, db: initial });
});

// Update or create user
app.post('/api/users', (req, res) => {
  const db = loadDB();
  const userData = req.body;
  
  if (!userData.email || !userData.name || !userData.role) {
    res.status(400).json({ error: 'Faltam campos obrigatórios (email, nome, função).' });
    return;
  }

  const existingIndex = db.users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());
  
  if (existingIndex > -1) {
    db.users[existingIndex] = {
      ...db.users[existingIndex],
      ...userData,
      id: db.users[existingIndex].id // keep ID
    };
    saveDB(db);
    res.json(db.users[existingIndex]);
  } else {
    const newUser: User = {
      id: userData.id || `user_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone || '',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'offline',
    };
    db.users.push(newUser);
    saveDB(db);
    res.json(newUser);
  }
});

// Create/Update Service Order
app.post('/api/orders', (req, res) => {
  const db = loadDB();
  const orderData = req.body;

  if (!orderData.title || !orderData.clientName || !orderData.clientAddress) {
    res.status(400).json({ error: 'Faltam dados essenciais da ordem de serviço.' });
    return;
  }

  if (orderData.id) {
    // Update existing
    const idx = db.orders.findIndex(o => o.id === orderData.id);
    if (idx > -1) {
      const previousOrder = db.orders[idx];
      const updatedOrder: ServiceOrder = {
        ...previousOrder,
        ...orderData,
        id: previousOrder.id, // preserve id
      };
      
      // Update employee status if assigned
      if (updatedOrder.assignedEmployeeId && updatedOrder.assignedEmployeeId !== previousOrder.assignedEmployeeId) {
        const emp = db.users.find(u => u.id === updatedOrder.assignedEmployeeId);
        if (emp) {
          updatedOrder.assignedEmployeeName = emp.name;
        }
      }
      
      db.orders[idx] = updatedOrder;
      saveDB(db);
      res.json(updatedOrder);
      return;
    }
  }

  // Create new
  const nextId = `OS-${1001 + db.orders.length}`;
  let empName = undefined;
  if (orderData.assignedEmployeeId) {
    const emp = db.users.find(u => u.id === orderData.assignedEmployeeId);
    if (emp) empName = emp.name;
  }

  const newOrder: ServiceOrder = {
    id: nextId,
    title: orderData.title,
    description: orderData.description || '',
    clientName: orderData.clientName,
    clientAddress: orderData.clientAddress,
    clientPhone: orderData.clientPhone || '',
    priority: orderData.priority || 'media',
    status: 'aberta',
    assignedEmployeeId: orderData.assignedEmployeeId || undefined,
    assignedEmployeeName: empName,
    createdBy: orderData.createdBy || 'admin1',
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  saveDB(db);
  res.json(newOrder);
});

// Update Service Order Status
app.post('/api/orders/:id/status', (req, res) => {
  const db = loadDB();
  const orderId = req.params.id;
  const { status, latitude, longitude, pauseReason, completionNotes, completionSignature } = req.body;

  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) {
    res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    return;
  }

  const order = db.orders[idx];
  order.status = status;

  if (status === 'em_andamento') {
    order.startedAt = new Date().toISOString();
    if (latitude && longitude) {
      order.startLatitude = latitude;
      order.startLongitude = longitude;
    }
    // Update employee state
    if (order.assignedEmployeeId) {
      const empIdx = db.users.findIndex(u => u.id === order.assignedEmployeeId);
      if (empIdx > -1) {
        db.users[empIdx].status = 'working';
        if (latitude && longitude) {
          db.users[empIdx].lastLatitude = latitude;
          db.users[empIdx].lastLongitude = longitude;
          db.users[empIdx].lastLocationUpdate = new Date().toISOString();
        }
      }
    }
  } else if (status === 'pausada') {
    order.pausedAt = new Date().toISOString();
    order.pauseReason = pauseReason || 'Pausado pelo funcionário';
    // Update employee state to idle
    if (order.assignedEmployeeId) {
      const empIdx = db.users.findIndex(u => u.id === order.assignedEmployeeId);
      if (empIdx > -1) {
        db.users[empIdx].status = 'idle';
      }
    }
  } else if (status === 'concluida') {
    order.completedAt = new Date().toISOString();
    order.completionNotes = completionNotes || '';
    order.completionSignature = completionSignature || '';
    if (latitude && longitude) {
      order.endLatitude = latitude;
      order.endLongitude = longitude;
    }
    // Update employee state to idle
    if (order.assignedEmployeeId) {
      const empIdx = db.users.findIndex(u => u.id === order.assignedEmployeeId);
      if (empIdx > -1) {
        db.users[empIdx].status = 'idle';
        if (latitude && longitude) {
          db.users[empIdx].lastLatitude = latitude;
          db.users[empIdx].lastLongitude = longitude;
          db.users[empIdx].lastLocationUpdate = new Date().toISOString();
        }
      }
    }
  }

  db.orders[idx] = order;
  saveDB(db);
  res.json(order);
});

// Update location endpoint
app.post('/api/location', (req, res) => {
  const db = loadDB();
  const { userId, latitude, longitude } = req.body;

  if (!userId || latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: 'Parâmetros inválidos.' });
    return;
  }

  const idx = db.users.findIndex(u => u.id === userId);
  if (idx > -1) {
    db.users[idx].lastLatitude = latitude;
    db.users[idx].lastLongitude = longitude;
    db.users[idx].lastLocationUpdate = new Date().toISOString();
    
    // Also update current active orders coordinates if any
    const activeOrder = db.orders.find(o => o.assignedEmployeeId === userId && o.status === 'em_andamento');
    if (activeOrder) {
      activeOrder.endLatitude = latitude; // live cursor tracking
      activeOrder.endLongitude = longitude;
    }

    saveDB(db);
    res.json({ success: true, user: db.users[idx] });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Chat messaging
app.post('/api/chats', (req, res) => {
  const db = loadDB();
  const { senderId, text, receiverId } = req.body;

  if (!senderId || !text) {
    res.status(400).json({ error: 'Dados da mensagem incompletos.' });
    return;
  }

  const sender = db.users.find(u => u.id === senderId);
  if (!sender) {
    res.status(404).json({ error: 'Remetente não encontrado.' });
    return;
  }

  const newChat: ChatMessage = {
    id: `chat_${Date.now()}`,
    senderId,
    senderName: sender.name,
    senderRole: sender.role,
    receiverId: receiverId || undefined,
    text,
    timestamp: new Date().toISOString()
  };

  db.chats.push(newChat);
  saveDB(db);
  res.json(newChat);
});

// Clock-in / Clock-out (ponto)
app.post('/api/clock', (req, res) => {
  const db = loadDB();
  const { employeeId, type, latitude, longitude } = req.body; // type = 'in' | 'out'

  const employee = db.users.find(u => u.id === employeeId);
  if (!employee) {
    res.status(404).json({ error: 'Funcionário não encontrado.' });
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('pt-BR');

  if (type === 'in') {
    // Check if already clocked in today
    const existing = db.timecards.find(tc => tc.employeeId === employeeId && tc.date === todayStr);
    if (existing) {
      res.status(400).json({ error: 'Você já bateu o ponto de entrada hoje.' });
      return;
    }

    const newTimecard: TimeCard = {
      id: `tc_${Date.now()}`,
      employeeId,
      employeeName: employee.name,
      date: todayStr,
      clockIn: timeStr,
      latitudeIn: latitude,
      longitudeIn: longitude
    };

    db.timecards.push(newTimecard);
    // update user status
    employee.status = 'idle';
    if (latitude && longitude) {
      employee.lastLatitude = latitude;
      employee.lastLongitude = longitude;
      employee.lastLocationUpdate = new Date().toISOString();
    }
    
    saveDB(db);
    res.json({ success: true, timecard: newTimecard, user: employee });
  } else {
    // clock out
    const existingIdx = db.timecards.findIndex(tc => tc.employeeId === employeeId && tc.date === todayStr && !tc.clockOut);
    if (existingIdx === -1) {
      // look for any clock in today
      const clockInAny = db.timecards.find(tc => tc.employeeId === employeeId && tc.date === todayStr);
      if (clockInAny && clockInAny.clockOut) {
        res.status(400).json({ error: 'Você já realizou a saída para o ponto de hoje.' });
        return;
      }
      res.status(400).json({ error: 'Nenhum ponto de entrada em aberto foi encontrado para hoje.' });
      return;
    }

    const tc = db.timecards[existingIdx];
    tc.clockOut = timeStr;
    tc.latitudeOut = latitude;
    tc.longitudeOut = longitude;
    
    // update user status to offline
    employee.status = 'offline';
    if (latitude && longitude) {
      employee.lastLatitude = latitude;
      employee.lastLongitude = longitude;
      employee.lastLocationUpdate = new Date().toISOString();
    }

    // also pause/stop active orders if any
    const activeOrders = db.orders.filter(o => o.assignedEmployeeId === employeeId && o.status === 'em_andamento');
    activeOrders.forEach(o => {
      o.status = 'pausada';
      o.pausedAt = new Date().toISOString();
      o.pauseReason = 'Funcionário registrou saída do ponto';
    });

    db.timecards[existingIdx] = tc;
    saveDB(db);
    res.json({ success: true, timecard: tc, user: employee });
  }
});


// Vite middleware integration or static directory serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zentex backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
