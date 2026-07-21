import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { User, ServiceOrder, ChatMessage, TimeCard } from './src/types';
import { createPixPayment, createCardPayment, getEfiConfig, parseEfiErrorDetails } from './efiService';
import { GoogleGenAI, Type } from '@google/genai';

// ES Module / CommonJS compatible path resolutions
const isESM = typeof import.meta !== 'undefined' && !!import.meta.url;
const resolvedFilename = isESM ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const resolvedDirname = isESM ? path.dirname(resolvedFilename) : (typeof __dirname !== 'undefined' ? __dirname : '');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize Firebase Admin with Firestore
let firestore: Firestore | null = null;
try {
  let firebaseApp;
  let firestoreDatabaseId = '(default)';

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    console.log('Initializing Firebase Admin via GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    
    let dbId = '(default)';
    const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(firebaseConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
        if (config.firestoreDatabaseId) {
          dbId = config.firestoreDatabaseId;
        }
      } catch (e) {
        // Safe fallback if parsing fails
      }
    }
    
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    firestoreDatabaseId = dbId;
    if (dbId && dbId !== '(default)') {
      firestore = getFirestore(firebaseApp, dbId);
    } else {
      firestore = getFirestore(firebaseApp);
    }
    console.log('Firebase Admin initialized using Service Account Cert. Firestore Database ID:', firestoreDatabaseId);
  } else {
    const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(firebaseConfigPath)) {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
      firebaseApp = initializeApp({
        projectId: config.projectId,
      });
      firestoreDatabaseId = config.firestoreDatabaseId || '(default)';
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
        firestore = getFirestore(firebaseApp, config.firestoreDatabaseId);
      } else {
        firestore = getFirestore(firebaseApp);
      }
      console.log('Firebase Admin initialized. Firestore Database ID:', firestoreDatabaseId);
    } else {
      console.warn('firebase-applet-config.json and GOOGLE_APPLICATION_CREDENTIALS_JSON not found. Running in local fallback mode.');
    }
  }
} catch (error) {
  console.warn('Firebase failed to initialize. Falling back to local data.json storage.', error);
}

// Default Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Antonio Claudio',
    email: 'antonio@zentex.com',
    role: 'admin',
    phone: '(11) 98888-1111',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'working',
    password: '123456',
    isTemporaryPassword: false,
    gender: 'male'
  },
  {
    id: 'admin2',
    name: 'Antonio Claudio (Gmail)',
    email: 'antonioclaudiofp@gmail.com',
    role: 'admin',
    phone: '(11) 98888-1111',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'working',
    password: '123456',
    isTemporaryPassword: false,
    gender: 'male'
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
    lastLocationUpdate: new Date().toISOString(),
    password: '123456',
    isTemporaryPassword: false,
    gender: 'male'
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
    lastLocationUpdate: new Date().toISOString(),
    password: '123456',
    isTemporaryPassword: false,
    gender: 'female'
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
    lastLocationUpdate: new Date().toISOString(),
    password: '123456',
    isTemporaryPassword: false,
    gender: 'male'
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

let memoryDB: DB = {
  users: [],
  orders: [],
  chats: [],
  timecards: []
};

function loadDB(): DB {
  return memoryDB;
}

async function saveDBToFirestore(db: DB) {
  if (!firestore) return;
  try {
    const batch = firestore.batch();
    
    // Write all documents (used for initial seed data)
    db.users.forEach(u => {
      const cleanU = JSON.parse(JSON.stringify(u));
      batch.set(firestore!.collection('users').doc(u.id), cleanU);
    });
    db.orders.forEach(o => {
      const cleanO = JSON.parse(JSON.stringify(o));
      batch.set(firestore!.collection('orders').doc(o.id), cleanO);
    });
    db.chats.forEach(c => {
      const cleanC = JSON.parse(JSON.stringify(c));
      batch.set(firestore!.collection('chats').doc(c.id), cleanC);
    });
    db.timecards.forEach(tc => {
      const cleanTc = JSON.parse(JSON.stringify(tc));
      batch.set(firestore!.collection('timecards').doc(tc.id), cleanTc);
    });
    
    await batch.commit();
  } catch (err) {
    console.error('Failed to sync saveDB to Firestore:', err);
  }
}

// Highly optimized real-time individual collection writers
async function saveUserToFirestore(user: User) {
  if (!firestore) return;
  try {
    const cleanUser = JSON.parse(JSON.stringify(user));
    await firestore.collection('users').doc(user.id).set(cleanUser);
    console.log(`Successfully synced user ${user.id} (${user.email}) to Firestore.`);
  } catch (err) {
    console.error(`Failed to save user ${user.id} to Firestore:`, err);
  }
}

async function deleteUserFromFirestore(id: string) {
  if (!firestore) return;
  try {
    await firestore.collection('users').doc(id).delete();
    console.log(`Successfully deleted user ${id} from Firestore.`);
  } catch (err) {
    console.error(`Failed to delete user ${id} from Firestore:`, err);
  }
}

async function deleteOrderFromFirestore(id: string) {
  if (!firestore) return;
  try {
    await firestore.collection('orders').doc(id).delete();
    console.log(`Successfully deleted order ${id} from Firestore.`);
  } catch (err) {
    console.error(`Failed to delete order ${id} from Firestore:`, err);
  }
}

async function saveOrderToFirestore(order: ServiceOrder) {
  if (!firestore) return;
  try {
    const cleanOrder = JSON.parse(JSON.stringify(order));
    await firestore.collection('orders').doc(order.id).set(cleanOrder);
    console.log(`Successfully synced order ${order.id} to Firestore.`);
  } catch (err) {
    console.error(`Failed to save order ${order.id} to Firestore:`, err);
  }
}

async function saveChatToFirestore(chat: ChatMessage) {
  if (!firestore) return;
  try {
    const cleanChat = JSON.parse(JSON.stringify(chat));
    await firestore.collection('chats').doc(chat.id).set(cleanChat);
    console.log(`Successfully synced chat message ${chat.id} to Firestore.`);
  } catch (err) {
    console.error(`Failed to save chat ${chat.id} to Firestore:`, err);
  }
}

async function saveTimecardToFirestore(tc: TimeCard) {
  if (!firestore) return;
  try {
    const cleanTc = JSON.parse(JSON.stringify(tc));
    await firestore.collection('timecards').doc(tc.id).set(cleanTc);
    console.log(`Successfully synced timecard ${tc.id} to Firestore.`);
  } catch (err) {
    console.error(`Failed to save timecard ${tc.id} to Firestore:`, err);
  }
}

function saveDB(db: DB) {
  memoryDB = db;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database file.', error);
  }
}

async function initDatabase() {
  if (firestore) {
    try {
      console.log('Loading database from Firestore...');
      const usersSnap = await firestore.collection('users').get();
      const ordersSnap = await firestore.collection('orders').get();
      const chatsSnap = await firestore.collection('chats').get();
      const timecardsSnap = await firestore.collection('timecards').get();

      if (usersSnap.empty && ordersSnap.empty) {
        console.log('Firestore collections are empty. Seeding with default data...');
        const initial: DB = {
          users: DEFAULT_USERS,
          orders: DEFAULT_ORDERS,
          chats: DEFAULT_CHATS,
          timecards: DEFAULT_TIMECARDS
        };
        memoryDB = initial;
        await saveDBToFirestore(initial);
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        console.log('Firestore successfully seeded on startup.');
      } else {
        const users: User[] = [];
        const orders: ServiceOrder[] = [];
        const chats: ChatMessage[] = [];
        const timecards: TimeCard[] = [];

        usersSnap.forEach(doc => users.push(doc.data() as User));
        ordersSnap.forEach(doc => orders.push(doc.data() as ServiceOrder));
        chatsSnap.forEach(doc => chats.push(doc.data() as ChatMessage));
        timecardsSnap.forEach(doc => timecards.push(doc.data() as TimeCard));

        memoryDB = { users, orders, chats, timecards };
        
        // Ensure user's Gmail is registered as admin
        const hasClaudioGmail = memoryDB.users.some(u => u.email.toLowerCase() === 'antonioclaudiofp@gmail.com');
        if (!hasClaudioGmail) {
          const defaultAdmin: User = {
            id: 'admin2',
            name: 'Antonio Claudio (Gmail)',
            email: 'antonioclaudiofp@gmail.com',
            role: 'admin',
            phone: '(11) 98888-1111',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'working',
            password: '123456',
            isTemporaryPassword: false
          };
          memoryDB.users.push(defaultAdmin);
          await firestore.collection('users').doc(defaultAdmin.id).set(defaultAdmin);
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
        console.log(`Database loaded from Firestore. Users: ${users.length}, Orders: ${orders.length}`);
      }

      // Start active real-time Firestore listeners to keep multi-container/multi-client instances perfectly synced
      console.log('Registering real-time Firestore snapshot listeners...');
      
      firestore.collection('users').onSnapshot(snap => {
        const users: User[] = [];
        snap.forEach(doc => users.push(doc.data() as User));
        
        // Always ensure admin gmail is kept in the list
        const hasClaudioGmail = users.some(u => u.email.toLowerCase() === 'antonioclaudiofp@gmail.com');
        if (!hasClaudioGmail) {
          users.push({
            id: 'admin2',
            name: 'Antonio Claudio (Gmail)',
            email: 'antonioclaudiofp@gmail.com',
            role: 'admin',
            phone: '(11) 98888-1111',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'working',
            password: '123456',
            isTemporaryPassword: false
          });
        }
        
        memoryDB.users = users;
        try {
          fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
        } catch (_) {}
      }, err => {
        console.error('Error in Firestore users snapshot listener:', err);
      });

      firestore.collection('orders').onSnapshot(snap => {
        const orders: ServiceOrder[] = [];
        snap.forEach(doc => orders.push(doc.data() as ServiceOrder));
        memoryDB.orders = orders;
        try {
          fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
        } catch (_) {}
      }, err => {
        console.error('Error in Firestore orders snapshot listener:', err);
      });

      firestore.collection('chats').onSnapshot(snap => {
        const chats: ChatMessage[] = [];
        snap.forEach(doc => chats.push(doc.data() as ChatMessage));
        chats.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        memoryDB.chats = chats;
        try {
          fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
        } catch (_) {}
      }, err => {
        console.error('Error in Firestore chats snapshot listener:', err);
      });

      firestore.collection('timecards').onSnapshot(snap => {
        const timecards: TimeCard[] = [];
        snap.forEach(doc => timecards.push(doc.data() as TimeCard));
        memoryDB.timecards = timecards;
        try {
          fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
        } catch (_) {}
      }, err => {
        console.error('Error in Firestore timecards snapshot listener:', err);
      });

      return;
    } catch (error) {
      console.error('Failed to load database from Firestore. Falling back to local data.json.', error);
    }
  }

  // Fallback to local file loading
  console.log('Loading database from local file system...');
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryDB = JSON.parse(content);
      
      // Dynamic migration to ensure user's Gmail is registered as admin
      const hasClaudioGmail = memoryDB.users.some(u => u.email.toLowerCase() === 'antonioclaudiofp@gmail.com');
      if (!hasClaudioGmail) {
        memoryDB.users.push({
          id: 'admin2',
          name: 'Antonio Claudio (Gmail)',
          email: 'antonioclaudiofp@gmail.com',
          role: 'admin',
          phone: '(11) 98888-1111',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'working',
          password: '123456',
          isTemporaryPassword: false
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
      }
      return;
    }
  } catch (error) {
    console.error('Failed to parse local database file.', error);
  }

  // Fallback to seeds
  memoryDB = {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    chats: DEFAULT_CHATS,
    timecards: DEFAULT_TIMECARDS
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
}

async function resetFirestore(): Promise<DB | null> {
  if (!firestore) return null;
  try {
    const usersSnap = await firestore.collection('users').get();
    const ordersSnap = await firestore.collection('orders').get();
    const chatsSnap = await firestore.collection('chats').get();
    const timecardsSnap = await firestore.collection('timecards').get();

    const seedUserIds = ['admin1', 'admin2', 'emp1', 'emp2', 'emp3'];
    const seedOrderIds = ['OS-1001', 'OS-1002', 'OS-1003', 'OS-1004'];
    const seedChatIds = ['chat1', 'chat2', 'chat3', 'chat4', 'chat5'];
    const seedTimecardIds = ['tc1', 'tc2'];

    const customUsers: User[] = [];
    usersSnap.forEach(doc => {
      const u = doc.data() as User;
      if (!seedUserIds.includes(u.id)) {
        customUsers.push(u);
      }
    });

    const customOrders: ServiceOrder[] = [];
    ordersSnap.forEach(doc => {
      const o = doc.data() as ServiceOrder;
      if (!seedOrderIds.includes(o.id)) {
        customOrders.push(o);
      }
    });

    const customChats: ChatMessage[] = [];
    chatsSnap.forEach(doc => {
      const c = doc.data() as ChatMessage;
      if (!seedChatIds.includes(c.id)) {
        customChats.push(c);
      }
    });

    const customTimecards: TimeCard[] = [];
    timecardsSnap.forEach(doc => {
      const tc = doc.data() as TimeCard;
      if (!seedTimecardIds.includes(tc.id)) {
        customTimecards.push(tc);
      }
    });

    // Clear Firestore
    const collections = ['users', 'orders', 'chats', 'timecards'];
    for (const colName of collections) {
      const snap = await firestore.collection(colName).get();
      const batch = firestore.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    const mergedDB: DB = {
      users: [...DEFAULT_USERS, ...customUsers],
      orders: [...DEFAULT_ORDERS, ...customOrders],
      chats: [...DEFAULT_CHATS, ...customChats],
      timecards: [...DEFAULT_TIMECARDS, ...customTimecards]
    };

    // Re-seed with combined data
    const batch = firestore.batch();
    mergedDB.users.forEach(u => {
      batch.set(firestore!.collection('users').doc(u.id), JSON.parse(JSON.stringify(u)));
    });
    mergedDB.orders.forEach(o => {
      batch.set(firestore!.collection('orders').doc(o.id), JSON.parse(JSON.stringify(o)));
    });
    mergedDB.chats.forEach(c => {
      batch.set(firestore!.collection('chats').doc(c.id), JSON.parse(JSON.stringify(c)));
    });
    mergedDB.timecards.forEach(tc => {
      batch.set(firestore!.collection('timecards').doc(tc.id), JSON.parse(JSON.stringify(tc)));
    });
    await batch.commit();

    console.log(`Firestore reset finished. Preserved ${customUsers.length} custom users/clients and ${customOrders.length} custom orders.`);
    return mergedDB;
  } catch (err) {
    console.error('Failed to reset collections in Firestore preserving custom data:', err);
    throw err;
  }
}

// Serve the high-resolution logo as an SVG file
app.get('/logo.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="blueRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="dropletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.15" />
    </filter>
  </defs>
  <circle cx="200" cy="200" r="180" fill="#ffffff" stroke="url(#blueRingGrad)" stroke-width="12" filter="url(#shadow)" />
  <g transform="translate(132, 50) scale(1.1)">
    <path d="M 62 142 L 22 120 L 22 50 L 38 41" stroke="#0284c7" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 68 18 L 114 44 L 114 114 L 92 126" stroke="#22c55e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 40 18 L 74 18" stroke="#22c55e" stroke-width="10" stroke-linecap="round" />
    <path d="M 36 114 L 36 72 L 48 72 L 48 114" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 48 84 L 60 84 L 60 114" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 78 60 C 64 76, 60 86, 60 96 C 60 106, 68 114, 78 114 C 88 114, 96 106, 96 96 C 96 86, 92 76, 78 60 Z" fill="url(#dropletGrad)" stroke="#16a34a" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 68 94 C 68 88, 72 82, 72 82" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
    <path d="M 84 48 C 84 43, 84 43, 89 43 C 84 43, 84 43, 84 38 C 84 43, 84 43, 79 43 C 84 43, 84 43, 84 48 Z" fill="#0284c7" />
  </g>
  <text x="200" y="278" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="48" fill="#0c2340" letter-spacing="0.05em" text-anchor="middle">ZENTEX</text>
  <text x="200" y="318" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="13" fill="#0284c7" letter-spacing="0.18em" text-anchor="middle">LIMPEZA E CONSERVAÇÃO</text>
</svg>`);
});

// Helper function to serve PNG logos, dynamically generating them if they don't exist yet
const serveLogoPng = (size: number, req: any, res: any) => {
  const filename = size === 512 ? 'logo.png' : `logo${size}.png`;
  const filePath = path.join(process.cwd(), filename);

  // Prevent aggressive browser/mobile cache on icon files
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
  } else {
    // If the file doesn't exist, try to convert on the fly using ImageMagick
    import('child_process').then(({ exec }) => {
      exec(`convert -background none -density 300 logo.svg -resize ${size}x${size} ${filename}`, (err) => {
        if (!err && fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'image/png');
          res.sendFile(filePath);
        } else {
          // Fallback to SVG if conversion is not possible
          res.redirect('/logo.svg');
        }
      });
    }).catch(() => {
      res.redirect('/logo.svg');
    });
  }
};

app.get('/logo.png', (req, res) => serveLogoPng(512, req, res));
app.get('/logo192.png', (req, res) => serveLogoPng(192, req, res));
app.get('/logo512.png', (req, res) => serveLogoPng(512, req, res));
app.get('/logo180.png', (req, res) => serveLogoPng(180, req, res));
app.get('/logo152.png', (req, res) => serveLogoPng(152, req, res));
app.get('/logo167.png', (req, res) => serveLogoPng(167, req, res));

// Standard mobile device fallback endpoints
app.get('/apple-touch-icon.png', (req, res) => serveLogoPng(180, req, res));
app.get('/apple-touch-icon-precomposed.png', (req, res) => serveLogoPng(180, req, res));
app.get('/favicon.ico', (req, res) => serveLogoPng(192, req, res));

// Client-side backup upload route to save canvas-rendered PNG
app.post('/api/save-logo-png', (req, res) => {
  try {
    const { image, size } = req.body;
    if (!image) {
      res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      return;
    }
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const targetSize = size || 512;
    const filename = targetSize === 512 ? 'logo.png' : `logo${targetSize}.png`;
    fs.writeFileSync(path.join(process.cwd(), filename), base64Data, 'base64');
    
    // Auto-generate other sizes from this uploaded base64 if possible
    if (targetSize === 512) {
      import('child_process').then(({ exec }) => {
        const sizes = [192, 180, 152, 167];
        sizes.forEach(s => {
          const sFilename = `logo${s}.png`;
          exec(`convert logo.png -resize ${s}x${s} ${sFilename}`);
        });
      }).catch(() => {});
    }
    res.json({ success: true, message: `Logo ${filename} saved successfully.` });
  } catch (err) {
    console.error('Failed to save logo from client:', err);
    res.status(500).json({ error: 'Erro ao salvar logo.' });
  }
});

// Serve PWA Service Worker
app.get('/sw.js', (req, res) => {
  const filePath = path.join(process.cwd(), 'sw.js');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
  } else {
    res.status(404).end();
  }
});

// Serve PWA logos and configuration files from the project root directory
app.get([
  '/logo.svg',
  '/logo.png',
  '/logo192.png',
  '/logo512.png',
  '/logo152.png',
  '/logo167.png',
  '/logo180.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png'
], (req, res) => {
  let filename = path.basename(req.path);
  if (filename === 'apple-touch-icon.png' || filename === 'apple-touch-icon-precomposed.png') {
    filename = 'logo180.png'; // Fallback to 180 size for Apple
  }
  
  let filePath = path.join(process.cwd(), filename);
  
  // If requesting logo512.png but logo512.png doesn't exist, use logo.png (which is the 512px logo)
  if (filename === 'logo512.png' && !fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'logo.png');
  }

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
  } else {
    res.status(404).end();
  }
});

// Serve the PWA Web Manifest
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    name: "Zentex",
    short_name: "Zentex",
    description: "Zentex - Limpeza e Conservação",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0284c7",
    icons: [
      {
        src: "/logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/logo512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/logo512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  });
});

// REST API Endpoints
app.get('/api/data', (req, res) => {
  const db = loadDB();
  
  // Dynamic offline clean up for stale technicians
  const now = Date.now();
  let dbChanged = false;
  db.users.forEach((u, idx) => {
    // Only auto-offline employees who were online (idle or working) but haven't updated in 10 minutes
    if (u.role === 'employee' && u.status !== 'offline' && u.lastLocationUpdate) {
      const lastUpdate = new Date(u.lastLocationUpdate).getTime();
      if (now - lastUpdate > 600 * 1000) { // 10 minutes tolerance for active connection (handles browser background tab throttling)
        db.users[idx].status = 'offline';
        dbChanged = true;
        saveUserToFirestore(db.users[idx]).catch(err => {
          console.error('Failed to auto-offline user in Firestore:', err);
        });
      }
    }
  });

  if (dbChanged) {
    saveDB(db);
  }

  res.json(db);
});

// Reset database to default mock seed data
app.post('/api/reset', async (req, res) => {
  let initial: DB = {
    users: DEFAULT_USERS,
    orders: DEFAULT_ORDERS,
    chats: DEFAULT_CHATS,
    timecards: DEFAULT_TIMECARDS
  };

  if (firestore) {
    try {
      const merged = await resetFirestore();
      if (merged) {
        initial = merged;
      }
    } catch (err) {
      console.error('Firestore reset failed, doing memory fallback reset', err);
      // Fallback local memory merge
      const seedUserIds = ['admin1', 'admin2', 'emp1', 'emp2', 'emp3'];
      const seedOrderIds = ['OS-1001', 'OS-1002', 'OS-1003', 'OS-1004'];
      const seedChatIds = ['chat1', 'chat2', 'chat3', 'chat4', 'chat5'];
      const seedTimecardIds = ['tc1', 'tc2'];

      const customUsers = memoryDB.users.filter(u => !seedUserIds.includes(u.id));
      const customOrders = memoryDB.orders.filter(o => !seedOrderIds.includes(o.id));
      const customChats = memoryDB.chats.filter(c => !seedChatIds.includes(c.id));
      const customTimecards = memoryDB.timecards.filter(tc => !seedTimecardIds.includes(tc.id));

      initial = {
        users: [...DEFAULT_USERS, ...customUsers],
        orders: [...DEFAULT_ORDERS, ...customOrders],
        chats: [...DEFAULT_CHATS, ...customChats],
        timecards: [...DEFAULT_TIMECARDS, ...customTimecards]
      };
    }
  } else {
    // Local memory fallback preserve custom data
    const seedUserIds = ['admin1', 'admin2', 'emp1', 'emp2', 'emp3'];
    const seedOrderIds = ['OS-1001', 'OS-1002', 'OS-1003', 'OS-1004'];
    const seedChatIds = ['chat1', 'chat2', 'chat3', 'chat4', 'chat5'];
    const seedTimecardIds = ['tc1', 'tc2'];

    const customUsers = memoryDB.users.filter(u => !seedUserIds.includes(u.id));
    const customOrders = memoryDB.orders.filter(o => !seedOrderIds.includes(o.id));
    const customChats = memoryDB.chats.filter(c => !seedChatIds.includes(c.id));
    const customTimecards = memoryDB.timecards.filter(tc => !seedTimecardIds.includes(tc.id));

    initial = {
      users: [...DEFAULT_USERS, ...customUsers],
      orders: [...DEFAULT_ORDERS, ...customOrders],
      chats: [...DEFAULT_CHATS, ...customChats],
      timecards: [...DEFAULT_TIMECARDS, ...customTimecards]
    };
  }

  saveDB(initial);
  res.json({ success: true, db: initial });
});

// Update or create user (from admin)
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
    saveUserToFirestore(db.users[existingIndex]);
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
      password: userData.password || '123456', // default/assigned temporary password
      isTemporaryPassword: userData.isTemporaryPassword !== undefined ? userData.isTemporaryPassword : true,
      gender: userData.gender || 'neutral',
      address: userData.address || '',
      documentId: userData.documentId || '',
      birthDate: userData.birthDate || '',
      admissionDate: userData.admissionDate || '',
      notes: userData.notes || ''
    };
    db.users.push(newUser);
    saveDB(db);
    saveUserToFirestore(newUser);
    res.json(newUser);
  }
});

// Delete user endpoint
app.delete('/api/users/:id', (req, res) => {
  const db = loadDB();
  const { id } = req.params;

  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Funcionário não encontrado.' });
    return;
  }

  const userToDelete = db.users[idx];
  // Guard: Avoid deleting the last administrator
  const admins = db.users.filter(u => u.role === 'admin');
  if (userToDelete.role === 'admin' && admins.length <= 1) {
    res.status(400).json({ error: 'Não é possível excluir o único administrador do sistema.' });
    return;
  }

  // Delete from local memory database
  db.users.splice(idx, 1);
  saveDB(db);

  // Sync delete to Firestore
  deleteUserFromFirestore(id).catch(err => {
    console.error('Failed to sync user deletion to Firestore:', err);
  });

  res.json({ success: true, message: 'Funcionário excluído com sucesso.' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const db = loadDB();
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Por favor, insira e-mail e senha.' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'E-mail não cadastrado.' });
    return;
  }

  // Handle users with missing password field gracefully
  const userPassword = user.password || '123456';

  if (userPassword !== password) {
    res.status(401).json({ error: 'Senha incorreta.' });
    return;
  }

  // Set status to idle (online) upon login and update lastLocationUpdate timestamp
  if (user.role === 'employee') {
    user.status = 'idle';
    user.lastLocationUpdate = new Date().toISOString();
    const uIdx = db.users.findIndex(u => u.id === user.id);
    if (uIdx > -1) {
      db.users[uIdx] = user;
    }
    saveDB(db);
    saveUserToFirestore(user).catch(err => {
      console.error('Failed to sync login status to Firestore:', err);
    });
  }

  res.json({ success: true, user });
});

// Logout endpoint to set status to offline immediately
app.post('/api/logout', (req, res) => {
  const db = loadDB();
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'ID do usuário ausente.' });
    return;
  }

  const idx = db.users.findIndex(u => u.id === userId);
  if (idx > -1) {
    db.users[idx].status = 'offline';
    saveDB(db);
    saveUserToFirestore(db.users[idx]).catch(err => {
      console.error('Failed to sync logout status to Firestore:', err);
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Heartbeat endpoint to update user online status & coordinates dynamically
app.post('/api/users/:id/heartbeat', (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  const idx = db.users.findIndex(u => u.id === id);
  if (idx > -1) {
    const user = db.users[idx];
    
    // Auto-online: if they are offline, set to idle!
    if (user.status === 'offline') {
      user.status = 'idle';
    }
    
    if (latitude !== undefined && longitude !== undefined) {
      user.lastLatitude = latitude;
      user.lastLongitude = longitude;
    }
    user.lastLocationUpdate = new Date().toISOString();
    
    // Also update current active orders coordinates if any
    if (user.status === 'working') {
      const activeOrder = db.orders.find(o => o.assignedEmployeeId === id && o.status === 'em_andamento');
      if (activeOrder && latitude !== undefined && longitude !== undefined) {
        activeOrder.endLatitude = latitude;
        activeOrder.endLongitude = longitude;
        saveOrderToFirestore(activeOrder).catch(err => {
          console.error('Failed to sync heartbeat order position to Firestore:', err);
        });
      }
    }

    db.users[idx] = user;
    saveDB(db);
    saveUserToFirestore(user).catch(err => {
      console.error('Failed to sync heartbeat user to Firestore:', err);
    });
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Change password endpoint
app.post('/api/change-password', (req, res) => {
  const db = loadDB();
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    res.status(400).json({ error: 'Dados incompletos para alteração de senha.' });
    return;
  }

  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  db.users[idx].password = newPassword;
  db.users[idx].isTemporaryPassword = false;
  saveDB(db);
  saveUserToFirestore(db.users[idx]);

  res.json({ success: true, user: db.users[idx] });
});

// Employee self-registration endpoint
app.post('/api/register', (req, res) => {
  const db = loadDB();
  const { name, email, phone, password, role, gender, address, avatar, documentId } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios.' });
    return;
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'E-mail já cadastrado no sistema Zentex.' });
    return;
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email,
    role: role || 'employee',
    phone: phone || '',
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: (role || 'employee') === 'employee' ? 'idle' : 'offline',
    password,
    isTemporaryPassword: false, // self-registered, so password is NOT temporary
    lastLocationUpdate: (role || 'employee') === 'employee' ? new Date().toISOString() : undefined,
    gender: gender || 'neutral',
    address: address || '',
    documentId: documentId || ''
  };

  db.users.push(newUser);
  saveDB(db);
  saveUserToFirestore(newUser);

  res.json({ success: true, user: newUser });
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
      saveOrderToFirestore(updatedOrder);
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

  // Generate stable, realistic deterministic coordinates within SÃ£o Paulo bounding box based on address
  const str = orderData.clientAddress || orderData.clientName || nextId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const normLat = Math.abs(Math.sin(hash)) % 1;
  const normLng = Math.abs(Math.cos(hash)) % 1;
  const computedLat = -23.5700 + normLat * 0.0300;
  const computedLng = -46.6700 + normLng * 0.0300;

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
    createdAt: new Date().toISOString(),
    startLatitude: computedLat,
    startLongitude: computedLng,
    price: orderData.price ? Number(orderData.price) : undefined,
    paymentStatus: orderData.paymentStatus || 'pendente',
    paymentMethod: orderData.paymentMethod || undefined,
    paymentDate: orderData.paymentDate || undefined
  };

  db.orders.push(newOrder);
  saveDB(db);
  saveOrderToFirestore(newOrder);
  res.json(newOrder);
});

// Delete Service Order
app.delete('/api/orders/:id', (req, res) => {
  const db = loadDB();
  const { id } = req.params;

  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    return;
  }

  // Remove from local memory database
  db.orders.splice(idx, 1);
  saveDB(db);

  // Sync deletion to Firestore
  deleteOrderFromFirestore(id).catch(err => {
    console.error('Failed to sync order deletion to Firestore:', err);
  });

  res.json({ success: true, message: 'Ordem de serviço excluída com sucesso.' });
});

// Update Service Order Status
app.post('/api/orders/:id/status', (req, res) => {
  const db = loadDB();
  const orderId = req.params.id;
  const { status, latitude, longitude, pauseReason, completionNotes, completionSignature, paymentStatus, paymentMethod } = req.body;

  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) {
    res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    return;
  }

  const order = db.orders[idx];
  
  if (status) {
    order.status = status;
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
    order.paymentDate = new Date().toISOString();
  }

  if (paymentMethod) {
    order.paymentMethod = paymentMethod;
  }

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
  saveOrderToFirestore(order);
  if (order.assignedEmployeeId) {
    const emp = db.users.find(u => u.id === order.assignedEmployeeId);
    if (emp) saveUserToFirestore(emp);
  }
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
    saveUserToFirestore(db.users[idx]);
    if (activeOrder) {
      saveOrderToFirestore(activeOrder);
    }
    res.json({ success: true, user: db.users[idx] });
  } else {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

// Efí Bank Integration Endpoints
app.get('/api/payment/efi/config', (req, res) => {
  const config = getEfiConfig();
  const accountCode = process.env.EFI_ACCOUNT_CODE || '';
  const hasCardConfig = !!(config && accountCode);
  const hasPixConfig = !!(config && config.pixKey && (config.certBase64 || config.certPath));

  res.json({
    isConfigured: hasCardConfig || hasPixConfig,
    hasCardConfig,
    hasPixConfig,
    isSandbox: config ? config.isSandbox : true,
    pixKey: config ? config.pixKey : null
  });
});

// Public Efí Configuration for the client-side
app.get('/api/payment/efi/public-config', (req, res) => {
  const config = getEfiConfig();
  const accountCode = process.env.EFI_ACCOUNT_CODE || '';
  
  const hasCardConfig = !!(config && accountCode);
  const hasPixConfig = !!(config && config.pixKey && (config.certBase64 || config.certPath));

  res.json({
    isSandbox: config ? config.isSandbox : true,
    accountCode,
    hasConfig: hasCardConfig || hasPixConfig,
    hasCardConfig,
    hasPixConfig,
    pixKey: config && config.pixKey ? `${config.pixKey.substring(0, 3)}***${config.pixKey.substring(config.pixKey.indexOf('@') > -1 ? config.pixKey.indexOf('@') : Math.max(3, config.pixKey.length - 3))}` : ''
  });
});

app.post('/api/payment/efi/create-pix', async (req, res) => {
  const { orderId, amount, clientName, clientCpf } = req.body;

  if (!orderId || !amount || !clientName) {
    res.status(400).json({ error: 'Dados insuficientes para gerar cobrança Pix.' });
    return;
  }

  const config = getEfiConfig();

  if (!config) {
    // Return a beautiful, interactive Demo Pix payment for the preview sandbox
    console.info(`[Efí Bank] Executando em modo de demonstração. Defina as variáveis de ambiente em .env para ativação real.`);
    
    // Create a deterministic sandbox copy-and-paste code
    const payload = `00020101021226830014br.gov.bcb.pix2561pix.api.efipay.com.br/v2/cobv/86e9ba35df424c58a5da28b7e28a96685204000053039865405${amount.toFixed(2)}5802BR5917ZENTEX%20SERVICOS6009SAO%20PAULO62070503***6304CA1F`;
    
    // We can use a public QR Code generator API to make a real visual QR Code containing the Pix payload!
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&qzone=1&data=${encodeURIComponent(payload)}`;

    res.json({
      isDemo: true,
      pixCopiaECola: payload,
      qrcodeImageUrl: qrCodeUrl,
      txid: `DEMO-${orderId}-${Math.floor(100000 + Math.random() * 900000)}`,
      message: 'Sistema em modo Sandbox do desenvolvedor. Conecte sua conta do Efí Bank no painel de segredos (.env) para ativar cobranças de verdade.'
    });
    return;
  }

  try {
    const efiResponse = await createPixPayment(Number(amount), orderId, clientName, clientCpf);
    res.json({
      isDemo: false,
      pixCopiaECola: efiResponse.pixCopiaECola,
      qrcodeImageBase64: efiResponse.qrcodeImageBase64, // Base64 returned from Efí
      txid: efiResponse.txid,
      locId: efiResponse.locId
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Erro ao gerar Pix no gateway Efí Bank.', 
      details: error.message,
      configError: true
    });
  }
});

app.post('/api/payment/efi/charge-card', async (req, res) => {
  const { orderId, amount, cardToken, clientName, clientEmail, clientCpf, installments, sandboxSimulation } = req.body;

  if (!orderId || !amount || !cardToken || !clientName || !clientEmail || !clientCpf) {
    res.status(400).json({ error: 'Dados de cartão ou do pagador incompletos.' });
    return;
  }

  const config = getEfiConfig();

  if (!config) {
    console.info(`[Efí Bank] Simulação de pagamento por cartão concluída em modo de demonstração.`);
    const isSuccess = sandboxSimulation !== 'declined';
    res.json({
      isDemo: true,
      success: isSuccess,
      chargeId: Math.floor(100000 + Math.random() * 900000),
      status: isSuccess ? 'pago' : 'reprovado',
      message: isSuccess ? 'Cartão simulado com sucesso no modo desenvolvedor.' : 'Transação recusada via simulação de teste.'
    });
    return;
  }

  // Interceptação proativa em Sandbox para evitar erros crípticos da API da Efí com tokens simulados
  if (config.isSandbox) {
    const isMockToken = cardToken === 'token_simulado_desenvolvedor' || !/^[a-fA-F0-9]{40}$/.test(cardToken);
    if (isMockToken || sandboxSimulation === 'declined') {
      const isSuccess = sandboxSimulation !== 'declined';
      console.info(`[Efí Bank Sandbox] Simulação proativa executada. Sucesso: ${isSuccess}.`);
      res.json({
        isDemo: true,
        success: isSuccess,
        chargeId: Math.floor(100000 + Math.random() * 900000),
        status: isSuccess ? 'pago' : 'reprovado',
        message: isSuccess 
          ? 'Pagamento autorizado via Simulação de Testes (Homologação).' 
          : 'Transação recusada via Simulação de Testes (Homologação).'
      });
      return;
    }
  }

  // Interceptação proativa em Produção para tokens inválidos (Ex: se o SDK não carregou no navegador do cliente)
  if (!config.isSandbox) {
    const isMockToken = cardToken === 'token_simulado_desenvolvedor' || !/^[a-fA-F0-9]{40}$/.test(cardToken);
    if (isMockToken) {
      console.warn(`[Efí Bank Produção] Bloqueando requisição de pagamento com token simulado ou inválido.`);
      res.status(400).json({
        error: 'Erro na inicialização do gateway de pagamento.',
        details: 'O SDK seguro de cartão de crédito da Efí Bank não pôde ser carregado ou inicializado corretamente no seu navegador. Isso pode acontecer devido a bloqueadores de anúncios (AdBlock) ou restrições de segurança do iframe do AI Studio. Por favor, desative o AdBlock, abra a aplicação em uma aba separada (fora do iframe) para pagar com segurança ou utilize a opção Pix.'
      });
      return;
    }
  }

  try {
    const efiResponse = await createCardPayment({
      amount: Number(amount),
      orderId,
      cardToken,
      clientName,
      clientEmail,
      clientCpf,
      installments: installments ? Number(installments) : 1
    });

    let finalStatus = efiResponse.status;
    let finalSuccess = efiResponse.success;

    if (config.isSandbox) {
      if (sandboxSimulation === 'declined') {
        console.info(`[Efí Bank Sandbox] Simulação forçada de status 'reprovado' via painel.`);
        finalStatus = 'reprovado';
        finalSuccess = false;
      } else {
        console.info(`[Efí Bank Sandbox] Forçando status 'pago' e sucesso para evitar autorizações aleatórias do ambiente de testes da Efí.`);
        finalStatus = 'pago';
        finalSuccess = true;
      }
    }

    res.json({
      isDemo: false,
      success: finalSuccess,
      chargeId: efiResponse.chargeId,
      status: finalStatus
    });
  } catch (error: any) {
    console.warn(`[Efí Bank] Erro ao chamar API de cartão em Sandbox/Produção:`, error.message);
    
    // Se estiver no ambiente de testes (isSandbox) e o usuário selecionou simular como aprovado,
    // toleramos qualquer erro de token/cadastro inválido da API da Efí e forçamos a simulação de aprovação.
    if (config.isSandbox && sandboxSimulation !== 'declined') {
      console.info(`[Efí Bank Sandbox] Tolerando erro da API de testes e autorizando transação via simulação.`);
      res.json({
        isDemo: true,
        success: true,
        chargeId: Math.floor(100000 + Math.random() * 900000),
        status: 'pago',
        message: 'Pagamento autorizado via Simulação de Testes (Homologação).'
      });
      return;
    }

    const friendlyError = parseEfiErrorDetails(error);
    res.status(400).json({ 
      error: 'Erro ao processar pagamento com cartão.', 
      details: friendlyError 
    });
  }
});

// Confirm Payment Success State
app.post('/api/payment/efi/confirm', (req, res) => {
  const db = loadDB();
  const { orderId, paymentMethod, price } = req.body;

  if (!orderId) {
    res.status(400).json({ error: 'ID da ordem de serviço é obrigatório.' });
    return;
  }

  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) {
    res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    return;
  }

  const order = db.orders[idx];
  order.paymentStatus = 'pago';
  order.paymentMethod = paymentMethod || 'pix';
  order.paymentDate = new Date().toISOString();
  if (price !== undefined) {
    order.price = Number(price);
  }

  db.orders[idx] = order;
  saveDB(db);
  saveOrderToFirestore(order);

  res.json({ success: true, order });
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
  saveChatToFirestore(newChat);
  res.json(newChat);
});

// Gemini Chatbot with structured fallback
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('A variável de ambiente GEMINI_API_KEY não está configurada.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

app.post('/api/gemini/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Mensagem vazia.' });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    // Construct contents with memory history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        const isUser = msg.senderRole === 'client' || msg.senderId !== 'zentex_bot';
        contents.push({
          role: isUser ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add current user query
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: `Você é o assistente virtual da Zentex, uma empresa de Limpeza e Conservação.
Sua função é tirar dúvidas de clientes sobre serviços, pacotes operacionais e uso do aplicativo.
Responda de forma natural, calorosa, amigável e profissional.

Sobre a Zentex:
- Oferece serviços de limpeza e sanitização de alta qualidade.
- Possui 5 pacotes com preços fixos:
  1. Limpeza Comercial Express: R$ 190,00 (Salas de até 60m², aspiração, pó, lixeiras e banheiros).
  2. Limpeza Residencial Profunda: R$ 290,00 (Casas de até 100m², cozinha/banheiros completos).
  3. Limpeza Pós-Obra Master: R$ 790,00 (Limpeza pesada pós-reforma).
  4. Limpeza de Vidros & Vitrines: R$ 160,00 (Limpeza de vitrines/vidraças térreas).
  5. Sanitização de Ambientes: R$ 380,00 (Higienização contra germes até 150m² com laudo técnico).
- Funcionalidades do Aplicativo do Cliente:
  - Pedir Serviço: Aba para escolher pacotes e abrir novas ordens de serviço.
  - Minhas Ordens: Aba para ver pedidos anteriores e em andamento. Permite clicar em "Rastrear no Radar" para abrir o mapa via satélite e rastrear a rota do técnico em tempo real.
  - Falar com Zentex: Aba de chat atual, que possui chat virtual (Zentex Bot) e suporte direto com a gerência humana (Suporte (Gerência)).
  - Meu Cadastro: Aba para atualizar nome, telefone, endereço e foto.

Instruções importantes:
- Se o cliente solicitar falar com um gerente, suporte humano, administrador, atendente humano, ou se a pergunta dele for sobre reclamações complexas, problemas operacionais graves, ou algo que você não saiba responder, defina transferToHuman como true e responda amigavelmente informando que está transferindo o atendimento para um gerente humano imediatamente.
- Caso contrário, responda à dúvida dele mantendo transferToHuman como false.
- Seja breve, objetivo e utilize emojis para deixar o chat dinâmico.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING,
              description: 'A resposta em português, amigável e natural, esclarecendo as dúvidas do cliente sobre a Zentex.',
            },
            transferToHuman: {
              type: Type.BOOLEAN,
              description: 'Defina como true se o cliente solicitou falar com um gerente, humano, suporte, atendimento, ou se o assunto for complexo/fora do escopo operacional da Zentex que o bot não saiba responder.',
            }
          },
          required: ['response', 'transferToHuman']
        }
      }
    });

    const responseText = response.text;
    if (responseText) {
      const data = JSON.parse(responseText.trim());
      res.json({
        response: data.response,
        transferToHuman: !!data.transferToHuman
      });
    } else {
      throw new Error('Nenhuma resposta do modelo.');
    }
  } catch (error: any) {
    console.warn('Gemini API call failed, running fallback logic.', error.message);
    
    // Resilient local matching
    let botResponse = '';
    let transferToHuman = false;
    const textLower = message.toLowerCase();

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

    res.json({
      response: botResponse,
      transferToHuman
    });
  }
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
    saveTimecardToFirestore(newTimecard);
    saveUserToFirestore(employee);
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
    saveTimecardToFirestore(tc);
    saveUserToFirestore(employee);
    activeOrders.forEach(o => {
      saveOrderToFirestore(o);
    });
    res.json({ success: true, timecard: tc, user: employee });
  }
});


// Pre-generate PNG logo assets using ImageMagick
const pregenerateLogos = () => {
  const sizes = [512, 192, 180, 152, 167];
  import('child_process').then(({ exec }) => {
    sizes.forEach(size => {
      const filename = size === 512 ? 'logo.png' : `logo${size}.png`;
      const filePath = path.join(process.cwd(), filename);
      if (!fs.existsSync(filePath)) {
        console.log(`Pre-generating logo ${filename}...`);
        exec(`convert -background none -density 300 logo.svg -resize ${size}x${size} ${filename}`, (err) => {
          if (err) {
            console.warn(`Failed to pre-generate logo ${filename}:`, err.message);
          } else {
            console.log(`Successfully pre-generated ${filename}`);
          }
        });
      }
    });
  }).catch((err) => {
    console.error('Failed to import child_process for pre-generating logos:', err);
  });
};

// Vite middleware integration or static directory serving
async function startServer() {
  await initDatabase();
  pregenerateLogos();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          usePolling: true, // Force polling watch in cloud container environments
          interval: 500
        }
      },
      appType: 'spa',
      optimizeDeps: { force: true } // Clear cached dependencies
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
