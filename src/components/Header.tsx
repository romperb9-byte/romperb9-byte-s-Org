import React from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Building2, 
  Layers, 
  UserCheck,
  PlusCircle,
  FileText,
  BarChart3,
  Settings,
  Users,
  MapPin
} from 'lucide-react';
import { VillageInfo } from '../types';
import { toKhmerNum } from '../utils/khmerLabels';

interface HeaderProps {
  village: VillageInfo;
  activeTab: 'dashboard' | 'households' | 'map' | 'new_survey' | 'report' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'households' | 'map' | 'new_survey' | 'report' | 'settings') => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  isSimulatedOffline: boolean;
  onToggleOffline: () => void;
  onSync: () => void;
  lastSyncedAt: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  village,
  activeTab,
  setActiveTab,
  isOnline,
  isSyncing,
  pendingCount,
  isSimulatedOffline,
  onToggleOffline,
  onSync,
  lastSyncedAt,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Banner with Royal/Official header motif */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-blue-950 font-bold text-xs shadow-xs">
              🇰🇭
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-bold text-amber-300 font-khmer-title tracking-wide">
                ប្រព័ន្ធជំរឿនស្ថិតិប្រជាជនកម្រិតភូមិ
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="text-slate-200">
                {village.villageNameKhmer} ({village.communeName} {village.districtName} {village.provinceName})
              </span>
            </div>
          </div>

          {/* Sync and Connection Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline Simulation Toggle */}
            <button
              id="btn-toggle-offline"
              onClick={onToggleOffline}
              title={isSimulatedOffline ? "បិទការសាកល្បងក្រៅបណ្តាញ (Go Online)" : "សាកល្បងប្រើប្រាស់ក្រៅបណ្តាញ (Test Offline Mode)"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                isSimulatedOffline
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                  : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20'
              }`}
            >
              {isSimulatedOffline ? <WifiOff size={13} className="text-amber-400" /> : <Wifi size={13} className="text-emerald-400" />}
              <span>{isSimulatedOffline ? 'កំពុងសាកល្បងក្រៅបណ្តាញ' : 'ស្ថានភាពបណ្តាញ'}</span>
            </button>

            {/* Connection Status Badge */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-200 border-rose-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{isOnline ? 'អនឡាញ (Online)' : 'ក្រៅបណ្តាញ (Offline)'}</span>
            </div>

            {/* Cloud Sync Button */}
            <button
              id="btn-cloud-sync"
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              title="ធ្វើសមកាលកម្មទិន្នន័យជាមួយពពក (Sync with Cloud Storage)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs transition-all ${
                pendingCount > 0
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 animate-pulse'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>
                {isSyncing ? 'កំពុងផ្ទេរ...' : pendingCount > 0 ? `បញ្ជូន ${toKhmerNum(pendingCount)} ជួរ` : 'សមកាលកម្ម'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-md">
              <Building2 size={22} className="text-amber-300" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-khmer-title leading-tight">
                {village.villageNameKhmer}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                កូដភូមិ: {toKhmerNum(village.villageCode)} • មេភូមិ: {village.villageChiefName}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 size={16} />
              <span className="hidden md:inline">ផ្ទាំងទិន្នន័យស្ថិតិ</span>
              <span className="md:hidden">ស្ថិតិ</span>
            </button>

            <button
              id="tab-households"
              onClick={() => setActiveTab('households')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'households'
                  ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users size={16} />
              <span className="hidden md:inline">បញ្ជីគ្រួសារ</span>
              <span className="md:hidden">គ្រួសារ</span>
            </button>

            {/* Map Navigation Tab */}
            <button
              id="tab-map"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin size={16} className="text-rose-600" />
              <span className="hidden md:inline">ផែនទីភូមិ (GIS)</span>
              <span className="md:hidden">ផែនទី</span>
            </button>

            <button
              id="tab-new-survey"
              onClick={() => setActiveTab('new_survey')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'new_survey'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <PlusCircle size={16} />
              <span className="hidden sm:inline">ស្រង់ស្ថិតិថ្មី</span>
              <span className="sm:hidden">+ ថ្មី</span>
            </button>

            <button
              id="tab-report"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={16} />
              <span className="hidden md:inline">របាយការណ៍ផ្លូវការ</span>
              <span className="md:hidden">របាយការណ៍</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="ការកំណត់ និងការបម្រុងទុក"
            >
              <Settings size={16} />
              <span className="hidden lg:inline">កំណត់ & ពពក</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
