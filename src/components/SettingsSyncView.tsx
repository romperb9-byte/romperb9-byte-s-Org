import React, { useState } from 'react';
import { 
  Save, 
  Cloud, 
  CloudRain, 
  RefreshCw, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { VillageInfo } from '../types';
import { toKhmerNum } from '../utils/khmerLabels';

interface SettingsSyncViewProps {
  village: VillageInfo;
  onSaveVillage: (village: VillageInfo) => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  onSyncNow: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => Promise<boolean>;
  onResetSample: () => void;
}

export const SettingsSyncView: React.FC<SettingsSyncViewProps> = ({
  village,
  onSaveVillage,
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncedAt,
  onSyncNow,
  onExportJSON,
  onImportJSON,
  onResetSample,
}) => {
  const [villageForm, setVillageForm] = useState<VillageInfo>({ ...village });
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmitVillage = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveVillage(villageForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await onImportJSON(content);
        if (success) {
          setImportStatus('បានបញ្ចូលទិន្នន័យបម្រុងទុកដោយជោគជ័យ!');
        } else {
          setImportStatus('ទម្រង់ឯកសារមិនត្រឹមត្រូវទេ!');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 font-khmer-title">
          ការកំណត់រដ្ឋបាលភូមិ និងការគ្រប់គ្រងទិន្នន័យពពក (Cloud & Sync)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          គ្រប់គ្រងរចនាសម្ព័ន្ធភូមិ ការធ្វើសមកាលកម្មទិន្នន័យលើអនឡាញ និងការបម្រុងទុកទិន្នន័យក្រៅបណ្តាញ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Village Profile Setting Form */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Building size={20} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 font-khmer-title">
                ព័ត៌មានរដ្ឋបាលភូមិ-ឃុំ
              </h2>
            </div>
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                <CheckCircle2 size={13} />
                <span>បានរក្សាទុក!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitVillage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ឈ្មោះភូមិ (ជាភាសាខ្មែរ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={villageForm.villageNameKhmer}
                  onChange={(e) => setVillageForm({ ...villageForm, villageNameKhmer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ឈ្មោះភូមិជាឡាតាំង</label>
                <input
                  type="text"
                  value={villageForm.villageNameLatin}
                  onChange={(e) => setVillageForm({ ...villageForm, villageNameLatin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">លេខកូដសម្គាល់ភូមិ</label>
                <input
                  type="text"
                  value={villageForm.villageCode}
                  onChange={(e) => setVillageForm({ ...villageForm, villageCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ឃុំ / សង្កាត់</label>
                <input
                  type="text"
                  required
                  value={villageForm.communeName}
                  onChange={(e) => setVillageForm({ ...villageForm, communeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ស្រុក / ខណ្ឌ</label>
                <input
                  type="text"
                  required
                  value={villageForm.districtName}
                  onChange={(e) => setVillageForm({ ...villageForm, districtName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ខេត្ត / រាជធានី</label>
                <input
                  type="text"
                  required
                  value={villageForm.provinceName}
                  onChange={(e) => setVillageForm({ ...villageForm, provinceName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ឈ្មោះមេភូមិ</label>
                <input
                  type="text"
                  value={villageForm.villageChiefName}
                  onChange={(e) => setVillageForm({ ...villageForm, villageChiefName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ទូរស័ព្ទមេភូមិ</label>
                <input
                  type="text"
                  value={villageForm.villageChiefPhone}
                  onChange={(e) => setVillageForm({ ...villageForm, villageChiefPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ឈ្មោះអ្នកស្រង់ស្ថិតិ</label>
                <input
                  type="text"
                  value={villageForm.surveyorName}
                  onChange={(e) => setVillageForm({ ...villageForm, surveyorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ចំនួនក្រុមសរុបក្នុងភូមិ</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={villageForm.totalGroupsCount}
                  onChange={(e) => setVillageForm({ ...villageForm, totalGroupsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                id="btn-save-village-profile"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Save size={15} />
                <span>រក្សាទុកព័ត៌មានរដ្ឋបាល</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Cloud Sync & Backup Engine */}
        <div className="space-y-6">
          {/* Cloud Storage Synchronization Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Cloud size={20} className="text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 font-khmer-title">
                ស្ថានភាពសមកាលកម្មពពក
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">ស្ថានភាពបណ្តាញ:</span>
                <span className={`font-bold ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isOnline ? '● អនឡាញ (Online)' : '● ក្រៅបណ្តាញ (Offline)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">ទិន្នន័យរង់ចាំបញ្ជូន (Queue):</span>
                <strong className={pendingCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-900'}>
                  {toKhmerNum(pendingCount)} ជួរ
                </strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">សមកាលកម្មចុងក្រោយ:</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'មិនទាន់មាន'}
                </span>
              </div>

              <button
                onClick={onSyncNow}
                disabled={isSyncing || !isOnline}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'កំពុងផ្ទេរទិន្នន័យ...' : 'ធ្វើសមកាលកម្មទិន្នន័យឥឡូវនេះ'}</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Database size={20} className="text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 font-khmer-title">
                ការបម្រុងទុក និងស្តារទិន្នន័យ (Backup)
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 text-xs leading-relaxed">
                អ្នកអាចទាញយកឯកសារបម្រុងទុក (JSON) ទុកក្នុងកុំព្យូទ័រ ឬទូរស័ព្ទ ដើម្បីសុវត្ថិភាពទិន្នន័យ។
              </p>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  {importStatus}
                </div>
              )}

              <button
                onClick={onExportJSON}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition-colors"
              >
                <Download size={14} />
                <span>ទាញយកទិន្នន័យបម្រុងទុក (JSON Backup)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition-colors cursor-pointer">
                <Upload size={14} />
                <span>បញ្ចូលទិន្នន័យពីឯកសារ JSON (Restore)</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យឡើងវិញជាទិន្នន័យគំរូដើម ឬ?')) {
                      onResetSample();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-xs"
                >
                  <RotateCcw size={13} />
                  <span>កំណត់ឡើងវិញជាទិន្នន័យគំរូ (Reset Demo)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
