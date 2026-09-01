import { Household, SyncQueueItem, VillageCensusSummary, VillageInfo } from '../types';
import { INITIAL_HOUSEHOLDS, INITIAL_VILLAGE_INFO } from '../data/mockData';

const DB_NAME = 'CambodiaVillageCensusDB';
const DB_VERSION = 1;
const STORE_HOUSEHOLDS = 'households';
const STORE_VILLAGE = 'village_info';
const STORE_SYNC_QUEUE = 'sync_queue';

class CensusStorage {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_HOUSEHOLDS)) {
          const hhStore = db.createObjectStore(STORE_HOUSEHOLDS, { keyPath: 'id' });
          hhStore.createIndex('groupNumber', 'location.groupNumber', { unique: false });
          hhStore.createIndex('householdCode', 'householdCode', { unique: false });
          hhStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_VILLAGE)) {
          db.createObjectStore(STORE_VILLAGE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed, fallback to localStorage');
        reject(request.error);
      };
    });
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await this.openDB();
      const existing = await this.getAllHouseholds();
      if (existing.length === 0) {
        // Seed initial village mock data
        for (const hh of INITIAL_HOUSEHOLDS) {
          await this.saveHouseholdLocally(hh, false);
        }
        await this.saveVillageInfo(INITIAL_VILLAGE_INFO);
      }
      this.isInitialized = true;
    } catch (err) {
      console.warn('Fallback initializing with LocalStorage', err);
      if (!localStorage.getItem('census_households')) {
        localStorage.setItem('census_households', JSON.stringify(INITIAL_HOUSEHOLDS));
        localStorage.setItem('census_village', JSON.stringify(INITIAL_VILLAGE_INFO));
      }
      this.isInitialized = true;
    }
  }

  // Get Village Information
  public async getVillageInfo(): Promise<VillageInfo> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_VILLAGE, 'readonly');
        const store = tx.objectStore(STORE_VILLAGE);
        const req = store.get('current_village');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            resolve(INITIAL_VILLAGE_INFO);
          }
        };
        req.onerror = () => resolve(INITIAL_VILLAGE_INFO);
      });
    } catch {
      const stored = localStorage.getItem('census_village');
      return stored ? JSON.parse(stored) : INITIAL_VILLAGE_INFO;
    }
  }

  // Save Village Information
  public async saveVillageInfo(info: VillageInfo): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_VILLAGE, 'readwrite');
        const store = tx.objectStore(STORE_VILLAGE);
        const req = store.put({ id: 'current_village', data: info, updatedAt: Date.now() });
        req.onsuccess = () => {
          localStorage.setItem('census_village', JSON.stringify(info));
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem('census_village', JSON.stringify(info));
    }
  }

  // Get all households
  public async getAllHouseholds(): Promise<Household[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_HOUSEHOLDS, 'readonly');
        const store = tx.objectStore(STORE_HOUSEHOLDS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result as Household[];
          resolve(list || []);
        };
        req.onerror = () => {
          const stored = localStorage.getItem('census_households');
          resolve(stored ? JSON.parse(stored) : []);
        };
      });
    } catch {
      const stored = localStorage.getItem('census_households');
      return stored ? JSON.parse(stored) : [];
    }
  }

  // Get household by ID
  public async getHouseholdById(id: string): Promise<Household | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_HOUSEHOLDS, 'readonly');
        const store = tx.objectStore(STORE_HOUSEHOLDS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      const list = await this.getAllHouseholds();
      return list.find((h) => h.id === id) || null;
    }
  }

  // Save/Update household locally
  public async saveHouseholdLocally(hh: Household, queueForSync: boolean = true): Promise<void> {
    const updatedHh: Household = {
      ...hh,
      updatedAt: Date.now(),
      syncStatus: queueForSync ? 'pending' : hh.syncStatus || 'synced',
      version: (hh.version || 0) + 1,
    };

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_HOUSEHOLDS, 'readwrite');
        const store = tx.objectStore(STORE_HOUSEHOLDS);
        const req = store.put(updatedHh);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      if (queueForSync) {
        await this.addToSyncQueue({
          id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          householdId: hh.id,
          action: 'update',
          data: updatedHh,
          timestamp: Date.now(),
        });
      }
    } catch {
      // LocalStorage fallback
      const households = await this.getAllHouseholds();
      const idx = households.findIndex((h) => h.id === hh.id);
      if (idx >= 0) {
        households[idx] = updatedHh;
      } else {
        households.unshift(updatedHh);
      }
      localStorage.setItem('census_households', JSON.stringify(households));
    }
  }

  // Delete household locally
  public async deleteHouseholdLocally(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_HOUSEHOLDS, 'readwrite');
        const store = tx.objectStore(STORE_HOUSEHOLDS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      await this.addToSyncQueue({
        id: `queue-del-${Date.now()}`,
        householdId: id,
        action: 'delete',
        timestamp: Date.now(),
      });
    } catch {
      const households = (await this.getAllHouseholds()).filter((h) => h.id !== id);
      localStorage.setItem('census_households', JSON.stringify(households));
    }
  }

  // Bulk overwrite/merge households from server
  public async bulkSaveFromServer(households: Household[]): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_HOUSEHOLDS, 'readwrite');
      const store = tx.objectStore(STORE_HOUSEHOLDS);
      for (const hh of households) {
        store.put({ ...hh, syncStatus: 'synced' });
      }
      localStorage.setItem('census_households', JSON.stringify(households));
    } catch {
      localStorage.setItem('census_households', JSON.stringify(households));
    }
  }

  // Sync Queue management
  public async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).put(item);
    } catch {
      const q = this.getLocalStorageQueue();
      q.push(item);
      localStorage.setItem('census_sync_queue', JSON.stringify(q));
    }
  }

  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
        const req = tx.objectStore(STORE_SYNC_QUEUE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getLocalStorageQueue());
      });
    } catch {
      return this.getLocalStorageQueue();
    }
  }

  public async clearSyncQueue(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).clear();
    } catch {
      // ignore
    }
    localStorage.removeItem('census_sync_queue');
  }

  private getLocalStorageQueue(): SyncQueueItem[] {
    const raw = localStorage.getItem('census_sync_queue');
    return raw ? JSON.parse(raw) : [];
  }

  // Reset database to initial sample dataset
  public async resetToDefaultSample(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([STORE_HOUSEHOLDS, STORE_SYNC_QUEUE], 'readwrite');
      tx.objectStore(STORE_HOUSEHOLDS).clear();
      tx.objectStore(STORE_SYNC_QUEUE).clear();
      for (const hh of INITIAL_HOUSEHOLDS) {
        tx.objectStore(STORE_HOUSEHOLDS).put(hh);
      }
    } catch {
      // ignore
    }
    localStorage.setItem('census_households', JSON.stringify(INITIAL_HOUSEHOLDS));
    localStorage.setItem('census_village', JSON.stringify(INITIAL_VILLAGE_INFO));
    localStorage.removeItem('census_sync_queue');
  }

  // Calculate Statistical Summary
  public calculateSummary(households: Household[]): VillageCensusSummary {
    let totalPopulation = 0;
    let totalMales = 0;
    let totalFemales = 0;
    let childrenUnder18 = 0;
    let childrenUnder5 = 0;
    let workingAge = 0;
    let elderly60Plus = 0;
    let femaleHeadedHouseholds = 0;

    let idpoor1 = 0;
    let idpoor2 = 0;
    let vulnerable = 0;
    let nonPoor = 0;

    let hasLatrineCount = 0;
    let cleanWaterCount = 0;

    let nationalGridCount = 0;
    let solarCount = 0;
    let batteryCount = 0;
    let noElectricityCount = 0;

    let totalFarmLandHectares = 0;
    let totalCattle = 0;
    let totalKoyon = 0;

    const educationStats: Record<string, number> = {};
    const occupationStats: Record<string, number> = {};
    const groupsMap: Record<string, { householdCount: number; populationCount: number; males: number; females: number }> = {};

    for (const hh of households) {
      if (hh.headGender === 'female') {
        femaleHeadedHouseholds++;
      }

      // Poverty
      if (hh.povertyLevel === 'idpoor_1') idpoor1++;
      else if (hh.povertyLevel === 'idpoor_2') idpoor2++;
      else if (hh.povertyLevel === 'vulnerable') vulnerable++;
      else nonPoor++;

      // WASH
      if (hh.wash.hasLatrine) hasLatrineCount++;
      if (['pipe_water', 'pump_well'].includes(hh.wash.waterSourceDry)) cleanWaterCount++;

      // Energy
      if (hh.energyAssets.electricitySource === 'national_grid') nationalGridCount++;
      else if (hh.energyAssets.electricitySource === 'solar') solarCount++;
      else if (hh.energyAssets.electricitySource === 'battery') batteryCount++;
      else noElectricityCount++;

      // Assets
      totalFarmLandHectares += Number(hh.energyAssets.agriculturalLandHectares || 0);
      totalCattle += Number(hh.energyAssets.cowsAndBuffalos || 0);
      totalKoyon += Number(hh.energyAssets.hasKoyonTiller || 0);

      const groupKey = hh.location.groupNumber || 'ទូទៅ';
      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = { householdCount: 0, populationCount: 0, males: 0, females: 0 };
      }
      groupsMap[groupKey].householdCount++;

      // Member stats
      for (const m of hh.members) {
        totalPopulation++;
        if (m.gender === 'male') {
          totalMales++;
          groupsMap[groupKey].males++;
        } else {
          totalFemales++;
          groupsMap[groupKey].females++;
        }
        groupsMap[groupKey].populationCount++;

        if (m.age < 5) childrenUnder5++;
        if (m.age < 18) childrenUnder18++;
        if (m.age >= 18 && m.age < 60) workingAge++;
        if (m.age >= 60) elderly60Plus++;

        // Education
        educationStats[m.educationLevel] = (educationStats[m.educationLevel] || 0) + 1;

        // Occupation
        const occ = m.primaryOccupation || 'ផ្សេងៗ';
        occupationStats[occ] = (occupationStats[occ] || 0) + 1;
      }
    }

    const groupsBreakdown = Object.keys(groupsMap)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((g) => ({
        groupNumber: g,
        ...groupsMap[g],
      }));

    return {
      totalHouseholds: households.length,
      totalPopulation,
      totalMales,
      totalFemales,
      childrenUnder18,
      childrenUnder5,
      workingAge,
      elderly60Plus,
      femaleHeadedHouseholds,
      povertyStats: {
        idpoor1,
        idpoor2,
        vulnerable,
        nonPoor,
      },
      washStats: {
        hasLatrineCount,
        hasLatrinePercent: households.length ? Math.round((hasLatrineCount / households.length) * 100) : 0,
        cleanWaterCount,
        cleanWaterPercent: households.length ? Math.round((cleanWaterCount / households.length) * 100) : 0,
      },
      energyStats: {
        nationalGridCount,
        solarCount,
        batteryCount,
        noElectricityCount,
      },
      educationStats,
      occupationStats,
      agricultureStats: {
        totalFarmLandHectares: Math.round(totalFarmLandHectares * 10) / 10,
        totalCattle,
        totalKoyon,
      },
      groupsBreakdown,
    };
  }

  // Export all data as JSON
  public async exportBackupJSON(): Promise<string> {
    const households = await this.getAllHouseholds();
    const village = await this.getVillageInfo();
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      village,
      households,
    };
    return JSON.stringify(payload, null, 2);
  }

  // Export census data as CSV
  public async exportCensusCSV(): Promise<string> {
    const households = await this.getAllHouseholds();
    const headers = [
      'កូដគ្រួសារ',
      'ក្រុមទី',
      'ផ្ទះលេខ',
      'ឈ្មោះមេគ្រួសារ',
      'ភេទមេគ្រួសារ',
      'អាយុមេគ្រួសារ',
      'ទូរស័ព្ទ',
      'ចំនួនសមាជិក',
      'ស្ថានភាពក្រីក្រ',
      'ប្រភេទផ្ទះ',
      'ប្រភពទឹក',
      'បង្គន់អនាម័យ',
      'ប្រភពអគ្គិសនី',
      'ដីកសិកម្ម(ហិកតា)',
      'គោក្របី(ក្បាល)',
      'កាលបរិច្ឆេទស្រង់'
    ];

    const rows = households.map(h => [
      `"${h.householdCode}"`,
      `"${h.location.groupNumber}"`,
      `"${h.location.houseNumber || ''}"`,
      `"${h.headName}"`,
      `"${h.headGender === 'male' ? 'ប្រុស' : 'ស្រី'}"`,
      h.headAge,
      `"${h.headPhone || ''}"`,
      h.members.length,
      `"${h.povertyLevel}"`,
      `"${h.housing.wallType}/${h.housing.roofType}"`,
      `"${h.wash.waterSourceDry}"`,
      `"${h.wash.hasLatrine ? 'មាន' : 'គ្មាន'}"`,
      `"${h.energyAssets.electricitySource}"`,
      h.energyAssets.agriculturalLandHectares || 0,
      h.energyAssets.cowsAndBuffalos || 0,
      `"${h.surveyDate}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Import JSON backup
  public async importBackupJSON(jsonStr: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonStr);
      if (data.village) {
        await this.saveVillageInfo(data.village);
      }
      if (Array.isArray(data.households)) {
        await this.bulkSaveFromServer(data.households);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

export const storageService = new CensusStorage();
