import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ServiceOrder } from '../types';
import { getAvatarUrl } from '../utils';
import { MapPin, Navigation, User as UserIcon, ZoomIn, ZoomOut, Compass, Search, RefreshCw, Radio, X, Laptop } from 'lucide-react';
import L from 'leaflet';

interface ZentexMapProps {
  users: User[];
  orders: ServiceOrder[];
  selectedUser?: User | null;
  onSelectUser?: (user: User) => void;
  className?: string;
}

export default function ZentexMap({ 
  users, 
  orders, 
  selectedUser, 
  onSelectUser, 
  className = 'h-[450px] md:h-[550px]' 
}: ZentexMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'working' | 'idle'>('all');
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const employeeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const ordersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasUserInteracted = useRef(false);

  // Filter employees
  const activeEmployees = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'employee') return false;
      if (filterStatus === 'working' && u.status !== 'working') return false;
      if (filterStatus === 'idle' && u.status !== 'idle') return false;
      
      if (searchQuery) {
        return u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               (u.phone && u.phone.includes(searchQuery));
      }
      return true;
    });
  }, [users, filterStatus, searchQuery]);

  // Dynamically calculate bounds for all technicians and service orders to auto-fit
  const bounds = useMemo(() => {
    const points: L.LatLngExpression[] = [];
    
    users.forEach(u => {
      if (u.role === 'employee' && u.lastLatitude && u.lastLongitude && !isNaN(u.lastLatitude) && !isNaN(u.lastLongitude)) {
        points.push([u.lastLatitude, u.lastLongitude]);
      }
    });
    
    orders.forEach(o => {
      let lat = o.startLatitude;
      let lng = o.startLongitude;
      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        if (o.id === 'OS-1001') { lat = -23.5616; lng = -46.6560; }
        else if (o.id === 'OS-1002') { lat = -23.5580; lng = -46.6620; }
        else if (o.id === 'OS-1003') { lat = -23.5500; lng = -46.6580; }
        else if (o.id === 'OS-1004') { lat = -23.5430; lng = -46.6440; }
      }
      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        points.push([lat, lng]);
      }
    });

    return points;
  }, [users, orders]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: São Paulo
      const defaultCenter: L.LatLngExpression = [-23.55052, -46.633308];
      
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(defaultCenter, 13);

      // Use CartoDB Voyager tile layer which has a permissive and friendly policy for mobile WebViews (avoids 403 Forbidden errors)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      // Add Attribution on bottom-left politely
      L.control.attribution({ position: 'bottomleft' })
        .setPrefix('')
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>')
        .addTo(map);

      // Initialize Marker Layer Groups
      employeeLayerGroupRef.current = L.layerGroup().addTo(map);
      ordersLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      setIsMapLoaded(true);

      // Trigger Resize fix shortly after mount
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, []);

  // Fit bounds when points are loaded and user hasn't zoomed manually yet
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || bounds.length === 0) return;

    if (!hasUserInteracted.current) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15 });
      } catch (err) {
        console.error('Failed to fit bounds', err);
      }
    }
  }, [bounds, isMapLoaded]);

  // Center Map on Selected Employee
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedUser || !selectedUser.lastLatitude || !selectedUser.lastLongitude) return;

    try {
      map.setView([selectedUser.lastLatitude, selectedUser.lastLongitude], 16, {
        animate: true,
        duration: 1
      });
      hasUserInteracted.current = true;
    } catch (err) {
      console.error('Failed to fly to selected employee', err);
    }
  }, [selectedUser]);

  // Render Employee Markers dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = employeeLayerGroupRef.current;
    if (!map || !group || !isMapLoaded) return;

    group.clearLayers();

    activeEmployees.forEach(emp => {
      if (!emp.lastLatitude || !emp.lastLongitude) return;

      const isSelected = selectedUser?.id === emp.id;
      const markerColor = emp.status === 'working' ? '#10b981' : emp.status === 'idle' ? '#f59e0b' : '#94a3b8';
      const statusText = emp.status === 'working' ? 'Em OS' : emp.status === 'idle' ? 'Livre' : 'Offline';

      // HTML custom pin
      const htmlContent = `
        <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -100%);">
          <!-- Ping Radar Halo for Selected Technician -->
          ${isSelected ? `
            <div class="absolute -top-[14px] w-[56px] h-[56px] rounded-full border-4 border-emerald-500/70 animate-ping" style="animation-duration: 2s;"></div>
          ` : ''}

          <!-- Pin Head (Circular Avatar with outline) -->
          <div class="relative w-11 h-11 bg-white rounded-full p-0.5 shadow-md border-2" style="border-color: ${markerColor};">
            <img 
              src="${getAvatarUrl(emp)}" 
              class="w-full h-full rounded-full object-cover"
              onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'"
              referrerpolicy="no-referrer"
            />
            <!-- Status Badge Dot -->
            <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style="background-color: ${markerColor};"></span>
          </div>

          <!-- Label Tag -->
          <div class="mt-1 px-2 py-0.5 bg-slate-900 text-white rounded-md shadow-lg text-[9px] font-bold whitespace-nowrap tracking-wide border border-white/20">
            ${(emp.name || '').split(' ')[0]} <span class="text-[8px] font-medium text-slate-300">(${statusText})</span>
          </div>

          <!-- Downward Arrow -->
          <div class="w-2 h-2 rotate-45 bg-slate-900 -mt-1 border-r border-b border-white/10"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-technician-marker',
        html: htmlContent,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([emp.lastLatitude, emp.lastLongitude], { icon: customIcon })
        .addTo(group);

      // On Marker Click, select user in state
      marker.on('click', () => {
        if (onSelectUser) onSelectUser(emp);
      });

      // Simple interactive popup
      marker.bindPopup(`
        <div class="p-2 font-sans select-none min-w-[160px]">
          <div class="flex items-center gap-2 mb-1.5">
            <img 
              src="${getAvatarUrl(emp)}" 
              class="w-8 h-8 rounded-full object-cover border" 
              onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'"
            />
            <div>
              <h4 class="text-xs font-bold text-slate-800 m-0 leading-tight">${emp.name}</h4>
              <p class="text-[10px] text-slate-500 m-0">${emp.phone || '(Sem telefone)'}</p>
            </div>
          </div>
          <div class="text-[10px] text-slate-600 border-t pt-1.5 mt-1 space-y-1">
            <p class="m-0"><strong>Status:</strong> <span class="font-bold" style="color: ${markerColor};">${statusText}</span></p>
            <p class="m-0 font-mono text-[9px] text-slate-400">${emp.lastLatitude.toFixed(6)}, ${emp.lastLongitude.toFixed(6)}</p>
          </div>
        </div>
      `, {
        closeButton: false,
        offset: [0, -25]
      });
    });
  }, [activeEmployees, selectedUser, isMapLoaded]);

  // Render Service Order Target Pins dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = ordersLayerGroupRef.current;
    if (!map || !group || !isMapLoaded) return;

    group.clearLayers();

    orders.forEach(order => {
      let customLat = order.startLatitude;
      let customLng = order.startLongitude;

      // Fallbacks to default São Paulo coordinates
      if (customLat === undefined || customLng === undefined || isNaN(customLat) || isNaN(customLng)) {
        if (order.id === 'OS-1001') { customLat = -23.5616; customLng = -46.6560; }
        else if (order.id === 'OS-1002') { customLat = -23.5580; customLng = -46.6620; }
        else if (order.id === 'OS-1003') { customLat = -23.5500; customLng = -46.6580; }
        else if (order.id === 'OS-1004') { customLat = -23.5430; customLng = -46.6440; }
        else {
          // Stable fallback coordinate spread
          const str = order.clientAddress || order.clientName || order.id || '';
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          const normLat = Math.abs(Math.sin(hash)) % 1;
          const normLng = Math.abs(Math.cos(hash)) % 1;
          customLat = -23.5700 + normLat * 0.0300;
          customLng = -46.6700 + normLng * 0.0300;
        }
      }

      if (customLat === undefined || customLng === undefined) return;

      const orderColor = order.status === 'em_andamento' 
        ? '#10b981' 
        : order.status === 'pausada' 
          ? '#f59e0b' 
          : order.status === 'concluida' 
            ? '#64748b' 
            : '#3b82f6';

      const statusLabel = order.status === 'em_andamento' 
        ? 'Em Andamento' 
        : order.status === 'pausada' 
          ? 'Pausada' 
          : order.status === 'concluida' 
            ? 'Concluída' 
            : 'Pendente';

      // HTML custom pin for Service Orders
      const htmlContent = `
        <div class="relative flex flex-col items-center select-none" style="transform: translate(-50%, -100%);">
          <!-- Radar ring for dynamic target -->
          ${order.status === 'em_andamento' ? `
            <div class="absolute -top-1 w-10 h-10 rounded-full border-2 border-emerald-500 animate-ping opacity-60" style="animation-duration: 2.5s;"></div>
          ` : ''}

          <!-- Outer Circle with target/flag design -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md border-2" style="border-color: ${orderColor};">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="${orderColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M 4 15 C 4 15, 6 13, 10 13 C 14 13, 16 15, 20 15 L 20 3 C 16 3, 14 5, 10 5 C 6 5, 4 3, 4 3 Z" fill="${orderColor}" fill-opacity="0.2" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>

          <!-- Small text overlay -->
          <div class="mt-1 px-1.5 py-0.5 bg-slate-850 text-white text-[8px] font-bold rounded shadow border border-white/10">
            ${order.id}
          </div>

          <!-- Downward arrow indicator -->
          <div class="w-1.5 h-1.5 rotate-45 bg-white -mt-0.5 border-r border-b" style="border-color: ${orderColor}; margin-top: -3px;"></div>
        </div>
      `;

      const orderIcon = L.divIcon({
        className: 'custom-order-marker',
        html: htmlContent,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([customLat, customLng], { icon: orderIcon })
        .addTo(group);

      // Popup content
      marker.bindPopup(`
        <div class="p-2.5 font-sans select-none min-w-[180px]">
          <span class="inline-block px-1.5 py-0.5 text-[8px] font-black text-white rounded uppercase tracking-wider mb-2" style="background-color: ${orderColor};">
            ${order.id} - ${statusLabel}
          </span>
          <h4 class="text-xs font-bold text-slate-800 m-0">${order.clientName}</h4>
          <p class="text-[10px] text-slate-500 m-0 mt-0.5">${order.clientAddress}</p>
          <div class="text-[10px] border-t pt-1.5 mt-1.5 space-y-1 text-slate-600">
            <p class="m-0"><strong>Serviço:</strong> ${order.title}</p>
            <p class="m-0"><strong>Descrição:</strong> ${order.description}</p>
          </div>
        </div>
      `, {
        closeButton: false,
        offset: [0, -20]
      });
    });
  }, [orders, users, isMapLoaded]);

  // Handle zooming using buttons
  const handleZoom = (direction: 'in' | 'out') => {
    hasUserInteracted.current = true;
    const map = mapInstanceRef.current;
    if (!map) return;
    if (direction === 'in') {
      map.zoomIn();
    } else {
      map.zoomOut();
    }
  };

  // Reset/re-fit bounds
  const handleReset = () => {
    hasUserInteracted.current = false;
    const map = mapInstanceRef.current;
    if (!map) return;
    
    setSearchQuery('');
    setFilterStatus('all');

    if (bounds.length > 0) {
      try {
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [50, 50] });
      } catch (err) {
        console.error('Failed to reset bounds', err);
      }
    } else {
      // Sao Paulo default view
      map.setView([-23.55052, -46.633308], 13);
    }
  };

  const isMini = className.includes('h-full') || className.includes('h-[230px]');

  return (
    <div className={`relative w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row ${className}`}>
      
      {/* Side Control Panel */}
      <div className={`${showSidebarMobile ? 'flex absolute inset-0 md:relative md:inset-auto bg-white/95' : 'hidden md:flex'} w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 p-4 flex-col justify-between z-25 md:z-10 shadow-sm transition-all`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h3 className="font-semibold text-slate-800 text-sm tracking-tight uppercase">Radar Zentex</h3>
            </div>
            {/* Close Mobile Sidebar */}
            <button
              onClick={() => setShowSidebarMobile(false)}
              className="md:hidden p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="mapSearchWorkerInput"
              name="mapSearchWorker"
              aria-label="Buscar funcionário"
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
                      setShowSidebarMobile(false);
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
                          src={getAvatarUrl(emp)}
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
                src={getAvatarUrl(selectedUser)}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{selectedUser.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${selectedUser.status === 'working' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedUser.lastLatitude ? `${selectedUser.lastLatitude.toFixed(5)}, ${selectedUser.lastLongitude?.toFixed(5)}` : 'Sem GPS'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map View Area */}
      <div 
        className={`w-full h-full ${isMini ? 'min-h-[220px]' : 'min-h-[400px] md:min-h-[500px]'} flex-1 relative bg-slate-150 overflow-hidden`}
      >
        {/* Real Leaflet DOM Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0 absolute inset-0" />

        {/* Floating Toggle Sidebar Button on mobile */}
        <div className="absolute top-4 left-4 z-10 md:hidden">
          <button
            onClick={() => setShowSidebarMobile(prev => !prev)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur border border-slate-200 px-3 py-2 rounded-xl shadow-md text-xs font-black text-slate-700 active:scale-95 transition-all"
          >
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Ver Equipe</span>
          </button>
        </div>

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
          <Compass className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
    </div>
  );
}
