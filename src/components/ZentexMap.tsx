import React, { useState } from 'react';
import { User, ServiceOrder } from '../types';
import { MapPin, Navigation, User as UserIcon, ZoomIn, ZoomOut, Compass, Search, RefreshCw, Radio } from 'lucide-react';

interface ZentexMapProps {
  users: User[];
  orders: ServiceOrder[];
  selectedUser?: User | null;
  onSelectUser?: (user: User) => void;
}

// Street network layout for the SVG map (coordinates in SVG space: 0-1000, 0-600)
// Center around Avenida Paulista
const STREETS = [
  { name: 'Avenida Paulista', x1: 50, y1: 450, x2: 950, y2: 150, width: 24, isAvenue: true },
  { name: 'Rua Augusta', x1: 300, y1: 50, x2: 600, y2: 550, width: 14 },
  { name: 'Alameda Lorena', x1: 100, y1: 500, x2: 850, y2: 250, width: 10 },
  { name: 'Rua Bela Vista', x1: 700, y1: 100, x2: 850, y2: 450, width: 10 },
  { name: 'Avenida Ipiranga (Centro)', x1: 150, y1: 100, x2: 600, y2: 100, width: 18, isAvenue: true },
  { name: 'Consolação', x1: 200, y1: 150, x2: 500, y2: 450, width: 14 }
];

const PLACES = [
  { name: 'Conjunto Nacional', x: 450, y: 320, type: 'mall' },
  { name: 'MASP (Museu de Arte)', x: 600, y: 260, type: 'museum' },
  { name: 'Parque Trianon', x: 650, y: 290, type: 'park' },
  { name: 'Copan (Centro)', x: 220, y: 100, type: 'building' }
];

export default function ZentexMap({ users, orders, selectedUser, onSelectUser }: ZentexMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'working' | 'idle'>('all');

  // Convert lat/long to SVG Coordinates (approximate mapping for Paulista region)
  // Lat: -23.54 to -23.57, Lng: -46.67 to -46.64
  const mapCoords = (lat?: number, lng?: number) => {
    if (!lat || !lng) return { x: 500, y: 300 };
    
    const minLat = -23.5700;
    const maxLat = -23.5400;
    const minLng = -46.6700;
    const maxLng = -46.6400;

    // Percentages
    const xPercent = (lng - minLng) / (maxLng - minLng);
    // Y is inverted in SVG
    const yPercent = 1 - (lat - minLat) / (maxLat - minLat);

    return {
      x: Math.max(50, Math.min(950, 100 + xPercent * 800)),
      y: Math.max(50, Math.min(550, 50 + yPercent * 500))
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(prev => Math.min(prev + 0.25, 2.5));
    } else {
      setZoom(prev => Math.max(prev - 0.25, 0.75));
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSearchQuery('');
    setFilterStatus('all');
  };

  // Filter employees
  const activeEmployees = users.filter(u => {
    if (u.role !== 'employee') return false;
    if (filterStatus === 'working' && u.status !== 'working') return false;
    if (filterStatus === 'idle' && u.status !== 'idle') return false;
    
    if (searchQuery) {
      return u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (u.phone && u.phone.includes(searchQuery));
    }
    return true;
  });

  return (
    <div className="relative w-full h-[520px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm select-none flex flex-col md:flex-row">
      
      {/* Side Control Panel */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 p-4 flex flex-col justify-between z-10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h3 className="font-semibold text-slate-800 text-sm tracking-tight uppercase">Radar Zentex</h3>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1.5 p-1 bg-slate-50 rounded-lg mb-4 border border-slate-200">
            {(['all', 'working', 'idle'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all ${
                  filterStatus === status
                    ? 'bg-white text-emerald-700 border border-emerald-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'all' ? 'Todos' : status === 'working' ? 'Em Atividade' : 'Disponíveis'}
              </button>
            ))}
          </div>

          {/* Employee Mini List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {activeEmployees.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">Nenhum técnico encontrado</div>
            ) : (
              activeEmployees.map((emp) => {
                const isSelected = selectedUser?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (onSelectUser) onSelectUser(emp);
                      // Center map to employee location
                      if (emp.lastLatitude && emp.lastLongitude) {
                        const coords = mapCoords(emp.lastLatitude, emp.lastLongitude);
                        setPan({ x: 400 - coords.x, y: 250 - coords.y });
                        setZoom(1.5);
                      }
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/50 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                          alt={emp.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          emp.status === 'working' ? 'bg-emerald-500' : emp.status === 'idle' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 truncate">{emp.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 truncate">
                            {emp.status === 'working' ? 'Ativo em OS' : emp.status === 'idle' ? 'Disponível' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected User Quick Telemetry */}
        {selectedUser && (
          <div className="mt-4 pt-4 border-t border-slate-150">
            <h5 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Telemetria Ativa</h5>
            <div className="mt-2 flex items-center gap-2.5">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{selectedUser.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${selectedUser.status === 'working' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedUser.lastLatitude ? `${selectedUser.lastLatitude.toFixed(4)}, ${selectedUser.lastLongitude?.toFixed(4)}` : 'Sem GPS'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map View Area */}
      <div 
        className="flex-1 relative bg-slate-100 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Map HUD */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <div className="flex gap-1.5 bg-white/95 backdrop-blur border border-slate-200 p-1.5 rounded-xl shadow-md">
            <button
              onClick={() => handleZoom('in')}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-lg transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-lg transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 rounded-lg transition-colors"
              title="Centralizar Radar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Compass Rose */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur p-2 rounded-full border border-slate-200 z-10 pointer-events-none shadow-sm">
          <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
        </div>

        {/* Map Canvas */}
        <div
          className="absolute w-full h-full transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            width="1100"
            height="700"
            viewBox="0 0 1100 700"
            className="w-full h-full select-none"
            style={{ minWidth: '1100px', minHeight: '700px' }}
          >
            {/* Grid Pattern Background */}
            <defs>
              <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeOpacity="0.2" />
              </pattern>
              <radialGradient id="skyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Background Glow Canvas */}
            <rect width="1100" height="700" fill="url(#skyGlow)" />
            <rect width="1100" height="700" fill="url(#mapGrid)" />

            {/* Styled Landmarks / Parks */}
            <circle cx="650" cy="290" r="45" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
            <text x="650" y="295" fill="#047857" fillOpacity="0.7" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">PARQUE TRIANON</text>

            <rect x="180" y="70" width="80" height="40" rx="4" fill="#f1f5f9" fillOpacity="0.8" stroke="#cbd5e1" strokeWidth="1" />
            <text x="220" y="94" fill="#475569" fillOpacity="0.8" fontSize="10" textAnchor="middle" className="pointer-events-none">COPAN (CENTRO)</text>

            {/* Street Grid Mapping */}
            {STREETS.map((street, idx) => (
              <g key={idx}>
                {/* Outer Glow */}
                <line
                  x1={street.x1}
                  y1={street.y1}
                  x2={street.x2}
                  y2={street.y2}
                  stroke={street.isAvenue ? '#e2e8f0' : '#f1f5f9'}
                  strokeWidth={street.width + 4}
                  strokeLinecap="round"
                  strokeOpacity="0.6"
                />
                {/* Street Inner Pavement */}
                <line
                  x1={street.x1}
                  y1={street.y1}
                  x2={street.x2}
                  y2={street.y2}
                  stroke={street.isAvenue ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth={street.width}
                  strokeLinecap="round"
                />
                {/* Center Yellow/White dashed line */}
                <line
                  x1={street.x1}
                  y1={street.y1}
                  x2={street.x2}
                  y2={street.y2}
                  stroke={street.isAvenue ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1"
                  strokeDasharray={street.isAvenue ? '8 6' : '4 4'}
                  strokeLinecap="round"
                  strokeOpacity="0.6"
                />
                {/* Street Label */}
                <text
                  x={(street.x1 + street.x2) / 2}
                  y={((street.y1 + street.y2) / 2) - (street.width / 2 + 4)}
                  fill="#475569"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  transform={`rotate(${Math.atan2(street.y2 - street.y1, street.x2 - street.x1) * 180 / Math.PI}, ${(street.x1 + street.x2) / 2}, ${(street.y1 + street.y2) / 2})`}
                  className="pointer-events-none select-none tracking-widest uppercase font-mono"
                >
                  {street.name}
                </text>
              </g>
            ))}

            {/* Draw Service Orders as Target Nodes */}
            {orders.map((order) => {
              // Only draw if we can map it
              const assignedEmp = users.find(u => u.id === order.assignedEmployeeId);
              // Fallback based on specific seed IDs
              let customLat = -23.555;
              let customLng = -46.655;
              if (order.id === 'OS-1001') { customLat = -23.5616; customLng = -46.6560; }
              else if (order.id === 'OS-1002') { customLat = -23.5580; customLng = -46.6620; }
              else if (order.id === 'OS-1003') { customLat = -23.5500; customLng = -46.6580; }
              else if (order.id === 'OS-1004') { customLat = -23.5430; customLng = -46.6440; }

              const coords = mapCoords(customLat, customLng);
              const orderColor = order.status === 'em_andamento' 
                ? '#10b981' 
                : order.status === 'pausada' 
                  ? '#f59e0b' 
                  : order.status === 'concluida' 
                    ? '#64748b' 
                    : '#3b82f6';

              return (
                <g key={order.id} className="cursor-pointer">
                  {/* Ping Animation for Active Task */}
                  {order.status === 'em_andamento' && (
                    <circle cx={coords.x} cy={coords.y} r="16" fill="none" stroke="#10b981" strokeWidth="1.5">
                      <animate attributeName="r" values="8;24;8" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Target Pin */}
                  <circle cx={coords.x} cy={coords.y} r="8" fill={orderColor} fillOpacity="0.2" stroke={orderColor} strokeWidth="1.5" />
                  <circle cx={coords.x} cy={coords.y} r="4" fill={orderColor} />
                  
                  {/* Flag Pole */}
                  <path d={`M ${coords.x} ${coords.y} L ${coords.x} ${coords.y - 12}`} stroke={orderColor} strokeWidth="1.5" />
                  <path d={`M ${coords.x} ${coords.y - 12} L ${coords.x + 8} ${coords.y - 16} L ${coords.x} ${coords.y - 20} Z`} fill={orderColor} />

                  {/* Label Tooltip */}
                  <g transform={`translate(${coords.x - 45}, ${coords.y - 32})`}>
                    <rect width="90" height="15" rx="3" fill="#ffffff" fillOpacity="0.95" stroke={orderColor} strokeWidth="1" className="shadow-sm" />
                    <text x="45" y="10" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {order.id} | {order.clientName.split(' - ')[0]}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Draw Technicians with Pulse Vectors */}
            {activeEmployees.map((emp) => {
              if (!emp.lastLatitude || !emp.lastLongitude) return null;
              const coords = mapCoords(emp.lastLatitude, emp.lastLongitude);
              const isSelected = selectedUser?.id === emp.id;
              
              // Define marker theme
              const markerTheme = emp.status === 'working' 
                ? { color: '#10b981', glow: 'rgba(16,185,129,0.3)' } 
                : emp.status === 'idle'
                  ? { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' }
                  : { color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' };

              return (
                <g 
                  key={emp.id} 
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectUser) onSelectUser(emp);
                  }}
                >
                  {/* Selected Marker Halo */}
                  {isSelected && (
                    <circle cx={coords.x} cy={coords.y} r="28" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3">
                      <animate attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Range Rings */}
                  <circle cx={coords.x} cy={coords.y} r="18" fill="none" stroke={markerTheme.color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 4" />

                  {/* Live Position Vector Cone */}
                  {emp.status === 'working' && (
                    <path
                      d={`M ${coords.x} ${coords.y} L ${coords.x - 25} ${coords.y - 15} A 30 30 0 0 1 ${coords.x + 15} ${coords.y - 25} Z`}
                      fill={markerTheme.color}
                      fillOpacity="0.08"
                      stroke={markerTheme.color}
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Custom Picture Pin */}
                  <g transform={`translate(${coords.x - 14}, ${coords.y - 32})`}>
                    {/* Pin Background Shape */}
                    <path
                      d="M 14 32 C 4 20 0 16 0 10 A 14 14 0 0 1 28 10 C 28 16 24 20 14 32 Z"
                      fill={markerTheme.color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    
                    {/* Avatar Clip Path */}
                    <defs>
                      <clipPath id={`avatarClip-${emp.id}`}>
                        <circle cx="14" cy="11" r="9" />
                      </clipPath>
                    </defs>

                    {/* Employee Avatar */}
                    <image
                      href={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                      x="5"
                      y="2"
                      width="18"
                      height="18"
                      clipPath={`url(#avatarClip-${emp.id})`}
                    />

                    {/* Status Dot */}
                    <circle cx="22" cy="5" r="3.5" fill={markerTheme.color} stroke="#ffffff" strokeWidth="1" />
                  </g>

                  {/* Hover Tag label */}
                  <g transform={`translate(${coords.x - 40}, ${coords.y + 8})`} className="opacity-90 group-hover:opacity-100 transition-opacity">
                    <rect width="80" height="14" rx="3" fill="#ffffff" fillOpacity="0.95" stroke={markerTheme.color} strokeWidth="1" className="shadow-sm" />
                    <text x="40" y="10" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {emp.name.split(' ')[0]} ({emp.status === 'working' ? 'Em OS' : 'Livre'})
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
