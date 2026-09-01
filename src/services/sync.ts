import { Household, VillageInfo } from '../types';
import { storageService } from './storage';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  serverHouseholdsCount: number;
  lastSyncedAt: number;
  error?: string;
}

class SyncService {
  private isOnlineStatus: boolean = navigator.onLine;
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;
  private listeners: Array<(status: { isOnline: boolean; isSyncing: boolean; pendingCount: number; lastSyncedAt: number | null }) => void> = [];
  private lastSyncedAt: number | null = null;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnlineStatus = true;
      this.notifyListeners();
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnlineStatus = false;
      this.notifyListeners();
    });
  }

  public subscribe(callback: (status: { isOnline: boolean; isSyncing: boolean; pendingCount: number; lastSyncedAt: number | null }) => void) {
    this.listeners.push(callback);
    this.emitCurrentStatus();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public async emitCurrentStatus() {
    const queue = await storageService.getSyncQueue();
    const effectiveOnline = this.isOnlineStatus && !this.isSimulatedOffline;
    this.listeners.forEach((l) =>
      l({
        isOnline: effectiveOnline,
        isSyncing: this.isSyncing,
        pendingCount: queue.length,
        lastSyncedAt: this.lastSyncedAt,
      })
    );
  }

  private notifyListeners() {
    this.emitCurrentStatus();
  }

  public toggleSimulatedOffline(): boolean {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    this.notifyListeners();
    if (!this.isSimulatedOffline && this.isOnlineStatus) {
      this.autoSync();
    }
    return this.isSimulatedOffline;
  }

  public getIsSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  public isEffectivelyOnline(): boolean {
    return this.isOnlineStatus && !this.isSimulatedOffline;
  }

  // Perform full two-way synchronization
  public async syncNow(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, serverHouseholdsCount: 0, lastSyncedAt: this.lastSyncedAt || 0, error: 'Sync already in progress' };
    }

    if (!this.isEffectivelyOnline()) {
      return {
        success: false,
        syncedCount: 0,
        serverHouseholdsCount: 0,
        lastSyncedAt: this.lastSyncedAt || 0,
        error: 'ក្រៅបណ្តាញ (Offline) - មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេលើពពកបានទេ'
      };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = await storageService.getSyncQueue();
      const localHouseholds = await storageService.getAllHouseholds();
      const villageInfo = await storageService.getVillageInfo();

      // POST to server sync endpoint
      const response = await fetch('/api/census/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue,
          localHouseholds,
          villageInfo,
          clientTimestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      
      if (resData.success && Array.isArray(resData.serverHouseholds)) {
        // Save synced server records into local database
        await storageService.bulkSaveFromServer(resData.serverHouseholds);
        if (resData.serverVillageInfo) {
          await storageService.saveVillageInfo(resData.serverVillageInfo);
        }
        await storageService.clearSyncQueue();
        this.lastSyncedAt = Date.now();

        return {
          success: true,
          syncedCount: queue.length,
          serverHouseholdsCount: resData.serverHouseholds.length,
          lastSyncedAt: this.lastSyncedAt,
        };
      } else {
        throw new Error(resData.message || 'Unknown sync response error');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('Sync failed:', errMsg);
      return {
        success: false,
        syncedCount: 0,
        serverHouseholdsCount: 0,
        lastSyncedAt: this.lastSyncedAt || 0,
        error: errMsg,
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // Auto sync on reconnection or changes
  public async autoSync() {
    if (this.isEffectivelyOnline()) {
      const queue = await storageService.getSyncQueue();
      if (queue.length > 0) {
        await this.syncNow();
      }
    }
  }

  // Fetch AI Demographic Insights via server endpoint
  public async generateAiReport(village: VillageInfo, households: Household[]): Promise<{ summaryHtml: string; recommendations: string[] }> {
    try {
      const resp = await fetch('/api/census/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ village, households }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('AI report fetch failed, using fallback rule engine', e);
    }

    // Fallback analytics engine
    const stats = storageService.calculateSummary(households);
    return {
      summaryHtml: `
        <p class="mb-2"><strong>របាយការណ៍សង្ខេបស្ថិតិភូមិ ${village.villageNameKhmer}៖</strong> ភូមិមានគ្រួសារសរុប <strong>${stats.totalHouseholds} គ្រួសារ</strong> ស្មើនឹងប្រជាជនសរុប <strong>${stats.totalPopulation} នាក់</strong> (ស្រី ${stats.totalFemales} នាក់)។</p>
        <p class="mb-2">អត្រាគ្រួសារក្រីក្រមាន <strong>${stats.povertyStats.idpoor1 + stats.povertyStats.idpoor2} គ្រួសារ</strong> (ក្រ១៖ ${stats.povertyStats.idpoor1}, ក្រ២៖ ${stats.povertyStats.idpoor2}) ស្មើនឹង ${stats.totalHouseholds ? Math.round(((stats.povertyStats.idpoor1 + stats.povertyStats.idpoor2) / stats.totalHouseholds) * 100) : 0}% នៃគ្រួសារសរុប។</p>
        <p>ស្ថានភាពអនាម័យមានការប្រើប្រាស់បង្គន់ <strong>${stats.washStats.hasLatrinePercent}%</strong> និងប្រភពទឹកស្អាត <strong>${stats.washStats.cleanWaterPercent}%</strong>។</p>
      `,
      recommendations: [
        `ពង្រឹងការទទួលបានបង្គន់អនាម័យដល់ ${stats.totalHouseholds - stats.washStats.hasLatrineCount} គ្រួសារដែលមិនទាន់មានបង្គន់ផ្ទាល់ខ្លួន`,
        `គាំទ្រមុខរបរបន្ថែម និងការបណ្តុះបណ្តាលវិជ្ជាជីវៈដល់គ្រួសារក្រីក្រកម្រិត ១ និង ២`,
        `យកចិត្តទុកដាក់លើការថែទាំសុខភាព និងរបបគាំពារសង្គមចំពោះមនុស្សចាស់ ៦០ ឆ្នាំឡើង (${stats.elderly60Plus} នាក់) និងកុមារក្រោម ៥ ឆ្នាំ (${stats.childrenUnder5} នាក់)`,
        `ជំរុញការតបណ្តាញអគ្គិសនីរដ្ឋ ឬថាមពលសូឡាស្អាតដល់គ្រួសារដែលប្រើប្រាស់អាគុយ`
      ]
    };
  }
}

export const syncService = new SyncService();
