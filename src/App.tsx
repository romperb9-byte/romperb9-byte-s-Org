/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Household, VillageCensusSummary, VillageInfo } from './types';
import { INITIAL_VILLAGE_INFO } from './data/mockData';
import { storageService } from './services/storage';
import { syncService, SyncResult } from './services/sync';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { HouseholdListView } from './components/HouseholdListView';
import { HouseholdFormView } from './components/HouseholdFormView';
import { VillageMapView } from './components/VillageMapView';
import { FamilyBookModal } from './components/FamilyBookModal';
import { OfficialReportView } from './components/OfficialReportView';
import { SettingsSyncView } from './components/SettingsSyncView';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'households' | 'map' | 'new_survey' | 'report' | 'settings'>('dashboard');
  const [village, setVillage] = useState<VillageInfo>(INITIAL_VILLAGE_INFO);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [summary, setSummary] = useState<VillageCensusSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Modals & Editing
  const [selectedHouseholdForModal, setSelectedHouseholdForModal] = useState<Household | null>(null);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  const loadData = async () => {
    setIsLoading(true);
    try {
      await storageService.init();
      const currentVillage = await storageService.getVillageInfo();
      const list = await storageService.getAllHouseholds();
      setVillage(currentVillage);
      setHouseholds(list);
      setSummary(storageService.calculateSummary(list));
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to sync service
    const unsubscribe = syncService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
      setLastSyncedAt(status.lastSyncedAt);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Recalculate summary whenever households change
  useEffect(() => {
    if (households.length > 0) {
      setSummary(storageService.calculateSummary(households));
    }
  }, [households]);

  // Handle Save or Update Household
  const handleSaveHousehold = async (hh: Household) => {
    try {
      await storageService.saveHouseholdLocally(hh, true);
      const updatedList = await storageService.getAllHouseholds();
      setHouseholds(updatedList);
      setSummary(storageService.calculateSummary(updatedList));
      setEditingHousehold(null);
      setActiveTab('households');
      showToast(`បានរក្សាទុកទិន្នន័យគ្រួសារ ${hh.headName} ដោយជោគជ័យ!`);

      // Auto trigger background sync if online
      syncService.autoSync();
    } catch (err) {
      console.error(err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុក!', 'error');
    }
  };

  // Handle Update Single Household GPS Location directly from map
  const handleUpdateHouseholdLocation = async (householdId: string, lat: number, lng: number) => {
    try {
      const target = households.find((h) => h.id === householdId);
      if (!target) return;

      const updated: Household = {
        ...target,
        location: {
          ...target.location,
          latitude: lat,
          longitude: lng,
        },
        updatedAt: Date.now(),
        syncStatus: 'pending',
        version: (target.version || 1) + 1,
      };

      await storageService.saveHouseholdLocally(updated, true);
      const refreshedList = await storageService.getAllHouseholds();
      setHouseholds(refreshedList);
      setSummary(storageService.calculateSummary(refreshedList));
      showToast(`បានកំណត់ទីតាំង GPS សម្រាប់គ្រួសារ ${target.headName} រួចរាល់!`);
      syncService.autoSync();
    } catch (err) {
      console.error(err);
      showToast('មិនអាចកំណត់ទីតាំងបានទេ!', 'error');
    }
  };

  // Handle Delete Household
  const handleDeleteHousehold = async (id: string) => {
    try {
      await storageService.deleteHouseholdLocally(id);
      const updatedList = await storageService.getAllHouseholds();
      setHouseholds(updatedList);
      setSummary(storageService.calculateSummary(updatedList));
      showToast('បានលុបទិន្នន័យគ្រួសាររួចរាល់!');
      syncService.autoSync();
    } catch (err) {
      console.error(err);
      showToast('មានបញ្ហាក្នុងការលុបទិន្នន័យ!', 'error');
    }
  };

  // Handle Save Village Profile
  const handleSaveVillage = async (info: VillageInfo) => {
    try {
      await storageService.saveVillageInfo(info);
      setVillage(info);
      showToast('បានរក្សាទុកព័ត៌មានរដ្ឋបាលភូមិ!');
    } catch (err) {
      console.error(err);
      showToast('មិនអាចរក្សាទុកបានទេ!', 'error');
    }
  };

  // Manual Cloud Sync
  const handleSyncNow = async () => {
    const res: SyncResult = await syncService.syncNow();
    if (res.success) {
      const refreshed = await storageService.getAllHouseholds();
      setHouseholds(refreshed);
      setSummary(storageService.calculateSummary(refreshed));
      showToast(`សមកាលកម្មជោគជ័យ! ទិន្នន័យលើពពកសរុប ${res.serverHouseholdsCount} គ្រួសារ`);
    } else {
      showToast(res.error || 'សមកាលកម្មមិនជោគជ័យ', 'error');
    }
  };

  // Toggle Simulated Offline
  const handleToggleOffline = () => {
    const isOffline = syncService.toggleSimulatedOffline();
    setIsSimulatedOffline(isOffline);
    showToast(isOffline ? 'បានបើកការសាកល្បងក្រៅបណ្តាញ (Simulated Offline)' : 'បានភ្ជាប់ប្រព័ន្ធអនឡាញវិញ (Online Mode)', 'info');
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const csv = await storageService.exportCensusCSV();
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ជំរឿនស្ថិតិ_${village.villageNameKhmer}_${village.surveyYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('បានទាញយកឯកសារ CSV/Excel រួចរាល់!');
    } catch (e) {
      console.error(e);
      showToast('មិនអាចទាញយកបានទេ', 'error');
    }
  };

  // Export JSON Backup
  const handleExportJSON = async () => {
    try {
      const json = await storageService.exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `village_census_backup_${village.villageCode}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('បានទាញយកឯកសារបម្រុងទុក (JSON) រួចរាល់!');
    } catch (e) {
      console.error(e);
      showToast('មិនអាចទាញយកបានទេ', 'error');
    }
  };

  // Import JSON Backup
  const handleImportJSON = async (jsonStr: string): Promise<boolean> => {
    const ok = await storageService.importBackupJSON(jsonStr);
    if (ok) {
      await loadData();
      showToast('បានស្តារទិន្នន័យពីឯកសារបម្រុងទុករួចរាល់!');
    }
    return ok;
  };

  // Reset to default sample
  const handleResetSample = async () => {
    await storageService.resetToDefaultSample();
    await loadData();
    showToast('បានកំណត់ឡើងវិញជាទិន្នន័យភូមិគំរូដើម!');
  };

  if (isLoading || !summary) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto"></div>
          <h2 className="text-base font-bold text-slate-800 font-khmer-title">
            កំពុងដំណើរការកម្មវិធីជំរឿនស្ថិតិភូមិ...
          </h2>
          <p className="text-xs text-slate-500">កំពុងផ្ទុកទិន្នន័យមូលដ្ឋាន និងទិន្នន័យផ្ទុកក្រៅបណ្តាញ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header with Navigation and Sync badges */}
      <Header
        village={village}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setEditingHousehold(null);
          setActiveTab(tab);
        }}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        isSimulatedOffline={isSimulatedOffline}
        onToggleOffline={handleToggleOffline}
        onSync={handleSyncNow}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 no-print">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            village={village}
            households={households}
            summary={summary}
            onNavigateToSurveys={() => setActiveTab('households')}
            onNavigateToNewSurvey={() => {
              setEditingHousehold(null);
              setActiveTab('new_survey');
            }}
            onNavigateToReport={() => setActiveTab('report')}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {/* Tab 2: Households List */}
        {activeTab === 'households' && (
          <HouseholdListView
            village={village}
            households={households}
            onSelectHousehold={(hh) => setSelectedHouseholdForModal(hh)}
            onEditHousehold={(hh) => {
              setEditingHousehold(hh);
              setActiveTab('new_survey');
            }}
            onDeleteHousehold={handleDeleteHousehold}
            onNewSurvey={() => {
              setEditingHousehold(null);
              setActiveTab('new_survey');
            }}
            onExportCSV={handleExportCSV}
            onNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {/* Tab 3: Village GIS Map View */}
        {activeTab === 'map' && (
          <VillageMapView
            village={village}
            households={households}
            onSelectHousehold={(hh) => setSelectedHouseholdForModal(hh)}
            onEditHousehold={(hh) => {
              setEditingHousehold(hh);
              setActiveTab('new_survey');
            }}
            onUpdateHouseholdLocation={handleUpdateHouseholdLocation}
            onNewSurvey={() => {
              setEditingHousehold(null);
              setActiveTab('new_survey');
            }}
          />
        )}

        {/* Tab 4: New / Edit Household Survey */}
        {activeTab === 'new_survey' && (
          <HouseholdFormView
            village={village}
            initialHousehold={editingHousehold}
            existingHouseholds={households}
            onSave={handleSaveHousehold}
            onCancel={() => {
              setEditingHousehold(null);
              setActiveTab('households');
            }}
          />
        )}

        {/* Tab 5: Official Village Census Report */}
        {activeTab === 'report' && (
          <OfficialReportView
            village={village}
            summary={summary}
            onBack={() => setActiveTab('dashboard')}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Tab 6: Settings & Sync Management */}
        {activeTab === 'settings' && (
          <SettingsSyncView
            village={village}
            onSaveVillage={handleSaveVillage}
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncedAt={lastSyncedAt}
            onSyncNow={handleSyncNow}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onResetSample={handleResetSample}
          />
        )}
      </main>

      {/* Printable Electronic Family Book Modal */}
      {selectedHouseholdForModal && (
        <FamilyBookModal
          village={village}
          household={selectedHouseholdForModal}
          onClose={() => setSelectedHouseholdForModal(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>ប្រព័ន្ធជំរឿនស្ថិតិប្រជាជន និងលំនៅដ្ឋានកម្រិតភូមិ</span> •{' '}
            <span className="font-semibold text-slate-700">{village.villageNameKhmer}</span> ({village.communeName} {village.districtName} {village.provinceName})
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>គាំទ្រការប្រើប្រាស់ក្រៅបណ្តាញ (Offline PWA & IndexedDB)</span>
            <span>•</span>
            <span>ផែនទីប្រព័ន្ធព័ត៌មានភូមិសាស្ត្រ (GIS Village Map)</span>
            <span>•</span>
            <span>ផ្ទុកលើពពក (Cloud Storage)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

