import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Navigation, 
  Compass, 
  Crosshair, 
  Users, 
  Eye, 
  Edit3, 
  ExternalLink, 
  Home, 
  Droplets, 
  Zap, 
  ShieldAlert, 
  Building, 
  School, 
  Maximize2, 
  Ruler, 
  CheckCircle, 
  AlertTriangle,
  X,
  ChevronRight,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { Household, VillageInfo } from '../types';
import { 
  POVERTY_LABELS, 
  GENDER_LABELS, 
  LATRINE_LABELS, 
  WATER_LABELS, 
  ELECTRICITY_LABELS, 
  toKhmerNum 
} from '../utils/khmerLabels';

interface VillageMapViewProps {
  village: VillageInfo;
  households: Household[];
  onSelectHousehold: (hh: Household) => void;
  onEditHousehold: (hh: Household) => void;
  onUpdateHouseholdLocation?: (householdId: string, lat: number, lng: number) => Promise<void>;
  onNewSurvey?: () => void;
}

// Color palettes for map pins
const POVERTY_PIN_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  idpoor_1: { bg: '#ef4444', border: '#b91c1c', text: '#ffffff', label: 'ក្រ១ (ក្រីក្រណាស់)' },
  idpoor_2: { bg: '#f97316', border: '#c2410c', text: '#ffffff', label: 'ក្រ២ (មធ្យម)' },
  vulnerable: { bg: '#8b5cf6', border: '#6d28d9', text: '#ffffff', label: 'ងាយរងគ្រោះ' },
  non_poor: { bg: '#10b981', border: '#047857', text: '#ffffff', label: 'មិនក្រីក្រ/ធម្មតា' },
};

const GROUP_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

type ColorMode = 'poverty' | 'latrine' | 'group' | 'electricity';
type MapLayerType = 'street' | 'satellite' | 'positron';

export const VillageMapView: React.FC<VillageMapViewProps> = ({
  village,
  households,
  onSelectHousehold,
  onEditHousehold,
  onUpdateHouseholdLocation,
  onNewSurvey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const measureLineRef = useRef<L.Polyline | null>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedPoverty, setSelectedPoverty] = useState<string>('all');
  const [selectedLatrine, setSelectedLatrine] = useState<string>('all');
  const [selectedGpsStatus, setSelectedGpsStatus] = useState<'all' | 'has_gps' | 'no_gps'>('all');
  const [colorMode, setColorMode] = useState<ColorMode>('poverty');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('street');
  const [showLabels, setShowLabels] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  // Tools state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [assigningLocationForHh, setAssigningLocationForHh] = useState<Household | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Extract unique groups available
  const availableGroups = useMemo(() => {
    const groups = Array.from(new Set<string>(households.map((h) => String(h.location.groupNumber || '')))).filter(Boolean);
    return groups.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [households]);

  // Calculate stats
  const totalWithGps = useMemo(() => households.filter((h) => h.location.latitude && h.location.longitude).length, [households]);
  const totalWithoutGps = households.length - totalWithGps;

  // Filtered households
  const filteredHouseholds = useMemo(() => {
    return households.filter((hh) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = hh.headName.toLowerCase().includes(term);
        const matchCode = hh.householdCode.toLowerCase().includes(term);
        const matchPhone = (hh.headPhone || '').includes(term);
        const matchLocation = (hh.location.streetOrLocationName || '').toLowerCase().includes(term);
        const matchMembers = hh.members.some((m) => m.fullNameKhmer.toLowerCase().includes(term) || (m.fullNameLatin || '').toLowerCase().includes(term));
        if (!matchName && !matchCode && !matchPhone && !matchLocation && !matchMembers) return false;
      }

      // Group
      if (selectedGroup !== 'all' && String(hh.location.groupNumber) !== selectedGroup) {
        return false;
      }

      // Poverty
      if (selectedPoverty !== 'all' && hh.povertyLevel !== selectedPoverty) {
        return false;
      }

      // Latrine
      if (selectedLatrine === 'has_latrine' && !hh.wash.hasLatrine) return false;
      if (selectedLatrine === 'no_latrine' && hh.wash.hasLatrine) return false;

      // GPS
      const hasGps = Boolean(hh.location.latitude && hh.location.longitude);
      if (selectedGpsStatus === 'has_gps' && !hasGps) return false;
      if (selectedGpsStatus === 'no_gps' && hasGps) return false;

      return true;
    });
  }, [households, searchTerm, selectedGroup, selectedPoverty, selectedLatrine, selectedGpsStatus]);

  // Village center calculation
  const villageCenter = useMemo((): [number, number] => {
    const coords = households.filter((h) => h.location.latitude && h.location.longitude);
    if (coords.length > 0) {
      const avgLat = coords.reduce((acc, h) => acc + (h.location.latitude || 0), 0) / coords.length;
      const avgLng = coords.reduce((acc, h) => acc + (h.location.longitude || 0), 0) / coords.length;
      return [avgLat, avgLng];
    }
    // Default center for Cambodia Kandal/Koh Thom
    return [11.2384, 105.0742];
  }, [households]);

  // Tile layer URLs
  const getTileLayer = (type: MapLayerType) => {
    switch (type) {
      case 'satellite':
        return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        });
      case 'positron':
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        });
      case 'street':
      default:
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });
    }
  };

  // Helper to determine pin color
  const getPinColor = (hh: Household) => {
    if (colorMode === 'poverty') {
      const p = POVERTY_PIN_COLORS[hh.povertyLevel] || POVERTY_PIN_COLORS.non_poor;
      return p.bg;
    }
    if (colorMode === 'latrine') {
      return hh.wash.hasLatrine ? '#10b981' : '#f43f5e';
    }
    if (colorMode === 'group') {
      const gNum = parseInt(hh.location.groupNumber, 10) || 1;
      return GROUP_COLORS[(gNum - 1) % GROUP_COLORS.length];
    }
    if (colorMode === 'electricity') {
      if (hh.energyAssets.electricitySource === 'national_grid') return '#2563eb';
      if (hh.energyAssets.electricitySource === 'solar') return '#f59e0b';
      return '#64748b';
    }
    return '#2563eb';
  };

  // Helper to create custom HTML DivIcon
  const createHouseholdIcon = (hh: Household, isSelected: boolean) => {
    const color = getPinColor(hh);
    const pov = POVERTY_LABELS[hh.povertyLevel];
    const isIDPoor = hh.povertyLevel === 'idpoor_1' || hh.povertyLevel === 'idpoor_2';

    return L.divIcon({
      className: 'custom-household-marker',
      html: `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <!-- Outer Pulsing Halo when selected -->
          ${isSelected ? `<div class="absolute -inset-2 bg-blue-500/40 rounded-full animate-ping"></div>` : ''}
          ${isIDPoor && !isSelected ? `<div class="absolute -inset-1.5 bg-red-400/30 rounded-full animate-pulse"></div>` : ''}
          
          <!-- Marker Body -->
          <div class="relative flex items-center justify-center transition-transform transform duration-200 group-hover:scale-110 shadow-lg"
               style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff;">
            <div style="transform: rotate(45deg);" class="text-white text-[11px] font-bold flex items-center justify-center">
              ${toKhmerNum(hh.location.groupNumber || '១')}
            </div>
          </div>

          <!-- Permanent Label or Tooltip -->
          ${showLabels ? `
            <div class="absolute top-1 left-1/2 transform -translate-x-1/2 translate-y-2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-md pointer-events-none border border-slate-700/60 z-20">
              ${hh.headName}
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -36],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: villageCenter,
        zoom: 16,
        zoomControl: false,
      });

      // Add Zoom Control top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add initial Tile layer
      const initialLayer = getTileLayer(mapLayer);
      initialLayer.addTo(map);
      tileLayerRef.current = initialLayer;

      // Add Layer groups
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      const landmarksLayer = L.layerGroup().addTo(map);
      landmarksLayerRef.current = landmarksLayer;

      // Handle map clicks for tools (measuring / location assigning)
      map.on('click', (e: L.LeafletMouseEvent) => {
        // Handled via state refs / event hooks
      });

      mapInstanceRef.current = map;
    }

    // ResizeObserver to prevent leaflet display collapse
    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when layer type changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = getTileLayer(mapLayer);
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // Handle map click events for measuring or location assignment
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      // 1. Measuring Tool Mode
      if (isMeasuring) {
        const newPoints = [...measurePoints, e.latlng];
        setMeasurePoints(newPoints);

        if (newPoints.length > 1) {
          let totalDist = 0;
          for (let i = 0; i < newPoints.length - 1; i++) {
            totalDist += newPoints[i].distanceTo(newPoints[i + 1]);
          }
          setMeasureDistance(Math.round(totalDist));

          // Draw or update polyline
          if (measureLineRef.current) {
            measureLineRef.current.setLatLngs(newPoints);
          } else {
            measureLineRef.current = L.polyline(newPoints, {
              color: '#3b82f6',
              weight: 4,
              dashArray: '6, 8',
            }).addTo(map);
          }
        }
        return;
      }

      // 2. Assigning Location for unmapped household
      if (assigningLocationForHh && onUpdateHouseholdLocation) {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        const hh = assigningLocationForHh;

        if (confirm(`តើអ្នកពិតជាចង់កំណត់ទីតាំង GPS [${lat}, ${lng}] សម្រាប់គ្រួសារ ${hh.headName} (កូដ: ${hh.householdCode}) ឬ?`)) {
          await onUpdateHouseholdLocation(hh.id, lat, lng);
          setAssigningLocationForHh(null);
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMeasuring, measurePoints, assigningLocationForHh, onUpdateHouseholdLocation]);

  // Render Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredHouseholds.forEach((hh) => {
      if (!hh.location.latitude || !hh.location.longitude) return;

      const latlng: [number, number] = [hh.location.latitude, hh.location.longitude];
      bounds.extend(latlng);

      const isSelected = selectedHouseholdId === hh.id;
      const markerIcon = createHouseholdIcon(hh, isSelected);

      const marker = L.marker(latlng, { icon: markerIcon });

      const pov = POVERTY_LABELS[hh.povertyLevel];
      const headGender = GENDER_LABELS[hh.headGender];

      // Popup Content Card
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-slate-900 min-w-[260px] max-w-[300px]';
      popupContent.innerHTML = `
        <div class="space-y-2.5">
          <!-- Top Title Bar -->
          <div class="border-b border-slate-200 pb-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                ${toKhmerNum(hh.householdCode)}
              </span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded ${pov.badgeClass}">
                ${pov.km}
              </span>
            </div>
            <h3 class="text-sm font-bold font-khmer-title text-slate-950 mt-1">
              ${hh.headName}
            </h3>
            <p class="text-[11px] text-slate-500">
              ភេទ: <strong>${headGender.km}</strong> • អាយុ: <strong>${toKhmerNum(hh.headAge)} ឆ្នាំ</strong>
            </p>
          </div>

          <!-- Location & Details -->
          <div class="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div>
              <span class="text-slate-500">ក្រុមទី:</span>
              <strong class="text-slate-900 font-bold"> ${toKhmerNum(hh.location.groupNumber)}</strong>
              ${hh.location.houseNumber ? `<span class="text-slate-600"> (ផ្ទះ ${toKhmerNum(hh.location.houseNumber)})</span>` : ''}
            </div>
            <div>
              <span class="text-slate-500">សមាជិក:</span>
              <strong class="text-blue-900 font-bold"> ${toKhmerNum(hh.members.length)} នាក់</strong>
            </div>
            <div class="col-span-2 text-slate-600 truncate">
              <span class="text-slate-500">ទីតាំង:</span> ${hh.location.streetOrLocationName || 'ក្នុងភូមិ'}
            </div>
          </div>

          <!-- Status Indicators -->
          <div class="space-y-1 text-[11px]">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">បង្គន់អនាម័យ:</span>
              <span class="font-bold ${hh.wash.hasLatrine ? 'text-emerald-700' : 'text-rose-600'}">
                ${hh.wash.hasLatrine ? `មាន (${LATRINE_LABELS[hh.wash.latrineType || 'pour_flush']})` : 'គ្មានបង្គន់'}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">ប្រភពទឹក:</span>
              <span class="font-medium text-slate-800">${WATER_LABELS[hh.wash.waterSourceDry] || hh.wash.waterSourceDry}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">អគ្គិសនី:</span>
              <span class="font-medium text-slate-800">${ELECTRICITY_LABELS[hh.energyAssets.electricitySource] || hh.energyAssets.electricitySource}</span>
            </div>
            ${hh.headPhone ? `
              <div class="flex items-center justify-between border-t border-slate-100 pt-1">
                <span class="text-slate-500">ទូរស័ព្ទ:</span>
                <span class="font-semibold text-slate-900">${hh.headPhone}</span>
              </div>
            ` : ''}
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200">
            <button id="btn-popup-familybook-${hh.id}" class="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors">
              <span>សៀវភៅគ្រួសារ</span>
            </button>
            <button id="btn-popup-edit-${hh.id}" class="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold border border-slate-300 transition-colors">
              <span>កែសម្រួល</span>
            </button>
          </div>

          <!-- Navigation link -->
          <a href="https://www.google.com/maps/dir/?api=1&destination=${hh.location.latitude},${hh.location.longitude}" target="_blank" rel="noreferrer" class="block text-center text-[10px] text-blue-600 hover:underline pt-0.5">
            🧭 នាំផ្លូវតាម Google Maps &rarr;
          </a>
        </div>
      `;

      // Attach button events after popup opens
      marker.bindPopup(popupContent, { maxWidth: 320 });
      marker.on('popupopen', () => {
        setSelectedHouseholdId(hh.id);
        const btnBook = document.getElementById(`btn-popup-familybook-${hh.id}`);
        if (btnBook) {
          btnBook.onclick = () => onSelectHousehold(hh);
        }
        const btnEdit = document.getElementById(`btn-popup-edit-${hh.id}`);
        if (btnEdit) {
          btnEdit.onclick = () => onEditHousehold(hh);
        }
      });

      marker.addTo(markersLayer);
    });

    // Render Village Landmarks if enabled
    const landmarksLayer = landmarksLayerRef.current;
    if (landmarksLayer) {
      landmarksLayer.clearLayers();
      if (showLandmarks && bounds.isValid()) {
        const center = bounds.getCenter();

        // Landmark 1: Village Pagoda
        const pagodaIcon = L.divIcon({
          className: 'custom-landmark-marker',
          html: `
            <div class="flex items-center justify-center bg-amber-500 text-white rounded-full w-8 h-8 border-2 border-white shadow-lg text-xs" title="វត្តអារាម">
              🛕
            </div>
            <div class="bg-amber-900/90 text-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              វត្តព្រែកតូច
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([center.lat + 0.002, center.lng - 0.002], { icon: pagodaIcon }).addTo(landmarksLayer).bindPopup('<strong>វត្តអារាមព្រែកតូច</strong><br/>មជ្ឈមណ្ឌលវប្បធម៌ និងសាសនាភូមិ');

        // Landmark 2: Primary School
        const schoolIcon = L.divIcon({
          className: 'custom-landmark-marker',
          html: `
            <div class="flex items-center justify-center bg-blue-600 text-white rounded-full w-8 h-8 border-2 border-white shadow-lg text-xs" title="សាលាបឋមសិក្សា">
              🏫
            </div>
            <div class="bg-blue-900/90 text-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              សាលាបឋមសិក្សា
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([center.lat - 0.0018, center.lng + 0.0025], { icon: schoolIcon }).addTo(landmarksLayer).bindPopup('<strong>សាលាបឋមសិក្សាភូមិព្រែកតូច</strong><br/>អប់រំកុមារថ្នាក់ទី ១ ដល់ ទី ៦');

        // Landmark 3: Health Post / Commune Hall
        const healthIcon = L.divIcon({
          className: 'custom-landmark-marker',
          html: `
            <div class="flex items-center justify-center bg-rose-600 text-white rounded-full w-8 h-8 border-2 border-white shadow-lg text-xs" title="ប៉ុស្តិ៍សុខភាព">
              🏥
            </div>
            <div class="bg-rose-900/90 text-rose-100 text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              ប៉ុស្តិ៍សុខភាព
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([center.lat - 0.0022, center.lng - 0.0015], { icon: healthIcon }).addTo(landmarksLayer).bindPopup('<strong>ប៉ុស្តិ៍សុខភាពភូមិ</strong><br/>សេវាសុខាភិបាលបឋម និងចាក់វ៉ាក់សាំង');
      }
    }
  }, [filteredHouseholds, colorMode, showLabels, showLandmarks, selectedHouseholdId]);

  // Fly to household location on click from side list
  const handleFlyToHousehold = (hh: Household) => {
    setSelectedHouseholdId(hh.id);
    if (hh.location.latitude && hh.location.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hh.location.latitude, hh.location.longitude], 18, {
        duration: 1.2,
      });

      // Find and open marker popup
      const markersLayer = markersLayerRef.current;
      if (markersLayer) {
        markersLayer.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const pos = layer.getLatLng();
            if (pos.lat === hh.location.latitude && pos.lng === hh.location.longitude) {
              layer.openPopup();
            }
          }
        });
      }
    } else {
      setAssigningLocationForHh(hh);
    }
  };

  // Zoom to Fit All Mapped Households
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords = filteredHouseholds
      .filter((h) => h.location.latitude && h.location.longitude)
      .map((h) => [h.location.latitude!, h.location.longitude!] as [number, number]);

    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], maxZoom: 18 });
    } else {
      map.setView(villageCenter, 16);
    }
  };

  // Locate current user position
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('ឧបករណ៍របស់អ្នកមិនគាំទ្រប្រព័ន្ធ GPS ទេ!');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setIsLocating(false);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([lat, lng], 18);

          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([lat, lng]);
          } else {
            userLocationMarkerRef.current = L.circleMarker([lat, lng], {
              radius: 9,
              color: '#ffffff',
              weight: 3,
              fillColor: '#3b82f6',
              fillOpacity: 1,
            }).addTo(map).bindPopup('<strong>📍 ទីតាំងបច្ចុប្បន្នរបស់អ្នកស្រង់ស្ថិតិ</strong>');
          }
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`មិនអាចចាប់យកទីតាំង GPS បានទេ៖ ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reset Distance Measuring Tool
  const handleToggleMeasure = () => {
    if (isMeasuring) {
      setIsMeasuring(false);
      setMeasurePoints([]);
      setMeasureDistance(null);
      if (measureLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(measureLineRef.current);
        measureLineRef.current = null;
      }
    } else {
      setIsMeasuring(true);
      setMeasurePoints([]);
      setMeasureDistance(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Stat and Control Summary Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-khmer-title">
                ផែនទីប្រព័ន្ធព័ត៌មានភូមិសាស្ត្រ (GIS Village Map)
              </h1>
              <p className="text-xs text-slate-500">
                បង្ហាញទីតាំងលំនៅដ្ឋានគ្រួសារ ស្ថានភាពជីវភាព និងអនាម័យក្នុង {village.villageNameKhmer}
              </p>
            </div>
          </div>
        </div>

        {/* Top Quick Status Metric Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <Users size={14} className="text-blue-600" />
            <span>គ្រួសារសរុប:</span>
            <strong className="text-slate-900">{toKhmerNum(households.length)}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>មានទីតាំង GPS:</span>
            <strong>{toKhmerNum(totalWithGps)} គ្រួសារ</strong>
          </div>

          {totalWithoutGps > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>មិនទាន់មាន GPS:</span>
              <strong>{toKhmerNum(totalWithoutGps)} គ្រួសារ</strong>
            </div>
          )}

          {onNewSurvey && (
            <button
              onClick={onNewSurvey}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>ស្រង់ស្ថិតិថ្មី</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map + Sidebar Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container Area */}
        <div className={`${isSidebarOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} transition-all duration-300 space-y-3`}>
          {/* Map Floating Control Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Color Mode Selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 whitespace-nowrap">ពណ៌តាម៖</span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setColorMode('poverty')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    colorMode === 'poverty' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  កម្រិតជីវភាព (IDPoor)
                </button>
                <button
                  onClick={() => setColorMode('latrine')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    colorMode === 'latrine' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  បង្គន់អនាម័យ (WASH)
                </button>
                <button
                  onClick={() => setColorMode('group')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    colorMode === 'group' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ក្រុមរដ្ឋបាល
                </button>
                <button
                  onClick={() => setColorMode('electricity')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    colorMode === 'electricity' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ថាមពលអគ្គិសនី
                </button>
              </div>
            </div>

            {/* Map Layer Switcher & Utility Tools */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tile layer selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setMapLayer('street')}
                  className={`px-2 py-1 rounded-lg font-medium ${mapLayer === 'street' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
                  title="ផែនទីផ្លូវធម្មតា"
                >
                  ផ្លូវ
                </button>
                <button
                  onClick={() => setMapLayer('satellite')}
                  className={`px-2 py-1 rounded-lg font-medium ${mapLayer === 'satellite' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
                  title="ផែនទីផ្កាយរណបពិត"
                >
                  ផ្កាយរណប
                </button>
                <button
                  onClick={() => setMapLayer('positron')}
                  className={`px-2 py-1 rounded-lg font-medium ${mapLayer === 'positron' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
                  title="ផែនទីស្រាលច្បាស់"
                >
                  ស្រាល
                </button>
              </div>

              {/* Toggle Name Labels */}
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  showLabels ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
                title="បង្ហាញ ឬលាក់ស្លាកឈ្មោះមេគ្រួសារលើផែនទី"
              >
                ស្លាកឈ្មោះ
              </button>

              {/* Measure Distance Tool */}
              <button
                onClick={handleToggleMeasure}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isMeasuring ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="វាស់ចម្ងាយរវាងចំណុចពីរ ឬច្រើន"
              >
                <Ruler size={13} />
                <span>{isMeasuring ? 'កំពុងវាស់...' : 'វាស់ចម្ងាយ'}</span>
              </button>

              {/* Locate Me */}
              <button
                onClick={handleLocateUser}
                disabled={isLocating}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition-colors"
                title="ស្វែងរកទីតាំង GPS បច្ចុប្បន្នរបស់ខ្ញុំ"
              >
                <Navigation size={13} className={isLocating ? 'animate-spin' : ''} />
                <span>{isLocating ? '...' : 'ទីតាំងខ្ញុំ'}</span>
              </button>

              {/* Fit Bounds */}
              <button
                onClick={handleFitBounds}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                title="ពង្រីកឱ្យសមស្របនឹងទំហំភូមិ (Fit All)"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Measuring Distance Banner Notice */}
          {isMeasuring && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-amber-700 shrink-0" />
                <span>
                  ចុចលើផែនទីដើម្បីកំណត់ចំណុចវាស់ចម្ងាយ។ {measureDistance !== null ? `ចម្ងាយសរុប៖ ${toKhmerNum(measureDistance)} ម៉ែត្រ (${toKhmerNum((measureDistance / 1000).toFixed(2))} គ.ម)` : 'សូមចុចលើចំណុចទី១ និងទី២...'}
                </span>
              </div>
              <button
                onClick={handleToggleMeasure}
                className="px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-[11px]"
              >
                បញ្ឈប់ការវាស់
              </button>
            </div>
          )}

          {/* Location Assignment Mode Banner Notice */}
          {assigningLocationForHh && (
            <div className="bg-blue-50 border border-blue-300 text-blue-950 p-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-700 shrink-0 animate-bounce" />
                <span>
                  កំពុងកំណត់ទីតាំង GPS សម្រាប់គ្រួសារ <strong>{assigningLocationForHh.headName}</strong> (កូដ: {assigningLocationForHh.householdCode})។ សូមចុចលើទីតាំងពិតប្រាកដនៅលើផែនទី!
                </span>
              </div>
              <button
                onClick={() => setAssigningLocationForHh(null)}
                className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-[11px]"
              >
                បោះបង់
              </button>
            </div>
          )}

          {/* Leaflet Interactive Canvas */}
          <div className="relative bg-slate-200 rounded-2xl border border-slate-300 shadow-inner overflow-hidden h-[540px] sm:h-[620px] w-full">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Floating Color Legend on Bottom Left of Map */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-[11px] space-y-1.5 max-w-[200px]">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                {colorMode === 'poverty' && 'សញ្ញាសម្គាល់ជីវភាព (IDPoor)'}
                {colorMode === 'latrine' && 'សញ្ញាសម្គាល់អនាម័យ (WASH)'}
                {colorMode === 'group' && 'សញ្ញាសម្គាល់ក្រុមរដ្ឋបាល'}
                {colorMode === 'electricity' && 'សញ្ញាសម្គាល់ថាមពល'}
              </div>

              {colorMode === 'poverty' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                    <span>ក្រ១ (ក្រីក្រណាស់)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
                    <span>ក្រ២ (ក្រីក្រមធ្យម)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0"></span>
                    <span>ងាយរងគ្រោះ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>មិនក្រីក្រ/ធម្មតា</span>
                  </div>
                </div>
              )}

              {colorMode === 'latrine' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>មានបង្គន់អនាម័យ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                    <span>គ្មានបង្គន់អនាម័យ</span>
                  </div>
                </div>
              )}

              {colorMode === 'group' && (
                <div className="space-y-1">
                  {availableGroups.slice(0, 5).map((grp, i) => (
                    <div key={grp} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }}></span>
                      <span>ក្រុមទី {toKhmerNum(grp)}</span>
                    </div>
                  ))}
                </div>
              )}

              {colorMode === 'electricity' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                    <span>អគ្គិសនីរដ្ឋ (EDC)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                    <span>ថាមពលសូឡា</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0"></span>
                    <span>អាគុយ ឬគ្មាន</span>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute top-4 left-4 z-20 bg-white/95 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              <span className="hidden sm:inline">{isSidebarOpen ? 'បិទបញ្ជី' : 'បើកបញ្ជីគ្រួសារ'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Household Search & Filter Sidebar */}
        {isSidebarOpen && (
          <div className="lg:col-span-4 xl:col-span-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[540px] sm:h-[685px]">
            {/* Header and Search */}
            <div className="space-y-3 pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 font-khmer-title text-sm">
                  បញ្ជីគ្រួសារលើផែនទី ({toKhmerNum(filteredHouseholds.length)})
                </h2>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGroup('all');
                    setSelectedPoverty('all');
                    setSelectedLatrine('all');
                    setSelectedGpsStatus('all');
                  }}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  កំណត់ឡើងវិញ
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬកូដ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Group Filter */}
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="all">គ្រប់ក្រុមទាំងអស់</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>ក្រុមទី {toKhmerNum(g)}</option>
                  ))}
                </select>

                {/* Poverty Filter */}
                <select
                  value={selectedPoverty}
                  onChange={(e) => setSelectedPoverty(e.target.value)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="all">គ្រប់កម្រិតជីវភាព</option>
                  <option value="idpoor_1">ក្រ១</option>
                  <option value="idpoor_2">ក្រ២</option>
                  <option value="vulnerable">ងាយរងគ្រោះ</option>
                  <option value="non_poor">មិនក្រីក្រ</option>
                </select>
              </div>

              {/* Latrine & GPS Filter */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={selectedLatrine}
                  onChange={(e) => setSelectedLatrine(e.target.value)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="all">អនាម័យ (ទាំងអស់)</option>
                  <option value="has_latrine">មានបង្គន់</option>
                  <option value="no_latrine">គ្មានបង្គន់</option>
                </select>

                <select
                  value={selectedGpsStatus}
                  onChange={(e) => setSelectedGpsStatus(e.target.value as any)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                >
                  <option value="all">GPS (ទាំងអស់)</option>
                  <option value="has_gps">មានកូអរដោនេ</option>
                  <option value="no_gps">គ្មានកូអរដោនេ</option>
                </select>
              </div>
            </div>

            {/* Scrollable Households List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1 mt-2">
              {filteredHouseholds.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  មិនមានទិន្នន័យគ្រួសារត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ
                </div>
              ) : (
                filteredHouseholds.map((hh) => {
                  const hasGps = Boolean(hh.location.latitude && hh.location.longitude);
                  const isSelected = selectedHouseholdId === hh.id;
                  const pov = POVERTY_LABELS[hh.povertyLevel];

                  return (
                    <div
                      key={hh.id}
                      onClick={() => handleFlyToHousehold(hh)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-300 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-blue-800">
                              {toKhmerNum(hh.householdCode)}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${pov.badgeClass}`}>
                              {pov.km}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs mt-0.5 font-khmer-title">
                            {hh.headName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ក្រុមទី {toKhmerNum(hh.location.groupNumber)} • សមាជិក {toKhmerNum(hh.members.length)} នាក់
                          </div>
                        </div>

                        {/* GPS indicator or Assign Button */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {hasGps ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <MapPin size={10} />
                              <span>លើផែនទី</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssigningLocationForHh(hh);
                              }}
                              className="text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 transition-colors"
                              title="ចុចដើម្បីកំណត់ទីតាំងលើផែនទី"
                            >
                              + ដាក់ GPS
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectHousehold(hh);
                            }}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            សៀវភៅគ្រួសារ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
