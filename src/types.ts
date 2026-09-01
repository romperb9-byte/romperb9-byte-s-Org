export type Gender = 'male' | 'female';

export type Relationship = 
  | 'head' // មេគ្រួសារ
  | 'spouse' // ប្រពន្ធ/ប្តី
  | 'child' // កូន
  | 'parent' // ឪពុក/ម្តាយ
  | 'grandchild' // ចៅ
  | 'sibling' // បងប្អូន
  | 'relative' // សាច់ញាតិ
  | 'other'; // ផ្សេងៗ

export type MaritalStatus = 
  | 'single' // នៅលីវ
  | 'married' // រៀបការ/មានប្តីប្រពន្ធ
  | 'widowed' // ពោះម៉ាយ/មេម៉ាយ
  | 'divorced'; // លែងលះ

export type EducationLevel = 
  | 'none' // មិនបានរៀន
  | 'primary_incomplete' // បឋមមិនចប់ (ថ្នាក់ទី ១-៥)
  | 'primary' // ចប់បឋម (ថ្នាក់ទី ៦)
  | 'secondary' // អនុវិទ្យាល័យ (ថ្នាក់ទី ៧-៩)
  | 'highschool' // វិទ្យាល័យ (ថ្នាក់ទី ១០-១២)
  | 'vocational' // បណ្តុះបណ្តាលវិជ្ជាជីវៈ
  | 'bachelor_plus' // បរិញ្ញាបត្រ ឬខ្ពស់ជាង
  | 'monk'; // បួសរៀន

export type PovertyLevel = 
  | 'idpoor_1' // ក្រីក្រកម្រិត ១ (ក្រ១ - ក្រណាស់)
  | 'idpoor_2' // ក្រីក្រកម្រិត ២ (ក្រ២ - មធ្យម)
  | 'vulnerable' // ងាយរងគ្រោះ
  | 'non_poor'; // មិនក្រីក្រ/ជីវភាពធម្មតា

export interface PersonMember {
  id: string;
  fullNameKhmer: string;
  fullNameLatin?: string;
  gender: Gender;
  relationship: Relationship;
  dob?: string;
  age: number;
  nationalId?: string; // លេខអត្តសញ្ញាណប័ណ្ណ ឬ សំបុត្រកំណើត
  maritalStatus: MaritalStatus;
  educationLevel: EducationLevel;
  primaryOccupation: string; // មុខរបរចម្បង
  hasDisability: boolean;
  disabilityType?: string; // ប្រភេទពិការភាព
  hasNSSF: boolean; // ប.ស.ស
  hasIDPoorCard: boolean; // ប័ណ្ណសមធម៌
  phone?: string;
  isHead?: boolean;
  notes?: string;
}

export interface HouseholdHousing {
  roofType: 'tin' | 'tile' | 'concrete' | 'thatch' | 'other';
  wallType: 'wood' | 'brick_concrete' | 'zinc' | 'bamboo_thatch' | 'other';
  floorType: 'wood' | 'tile_cement' | 'dirt' | 'other';
  houseOwnership: 'owned' | 'rented' | 'shelter' | 'relatives';
  houseCondition: 'good' | 'medium' | 'dilapidated'; // ល្អ មធ្យម ទ្រុឌទ្រោម
}

export interface HouseholdWASH {
  waterSourceDry: 'pipe_water' | 'pump_well' | 'dug_well' | 'pond_rain' | 'purchased' | 'stream' | 'other';
  waterSourceWet: 'pipe_water' | 'pump_well' | 'dug_well' | 'pond_rain' | 'purchased' | 'stream' | 'other';
  hasLatrine: boolean;
  latrineType?: 'pour_flush' | 'dry_pit' | 'shared' | 'none';
  wasteManagement: 'burn' | 'bury' | 'collection_service' | 'open_dump';
}

export interface HouseholdEnergyAssets {
  electricitySource: 'national_grid' | 'solar' | 'battery' | 'generator' | 'none';
  hasMotorbike: number;
  hasBicycle: number;
  hasCarOrTruck: number;
  hasKoyonTiller: number; // គោយន្ត
  hasBoat: number;
  agriculturalLandHectares: number; // ដីកសិកម្ម (ហិកតា)
  residentialLandSqm: number; // ដីភូមិ/លំនៅដ្ឋាន (ម៉ែត្រការ៉េ)
  cowsAndBuffalos: number; // គោ/ក្របី
  pigs: number; // ជ្រូក
  poultry: number; // មាន់/ទា
}

export interface HouseholdLocation {
  latitude?: number;
  longitude?: number;
  groupNumber: string; // ក្រុមទី
  houseNumber?: string; // ផ្ទះលេខ
  streetOrLocationName?: string;
}

export interface Household {
  id: string;
  householdCode: string; // លេខកូដគ្រួសារ ឧ. ភ-០១-០០១
  headName: string;
  headGender: Gender;
  headAge: number;
  headPhone?: string;
  members: PersonMember[];
  housing: HouseholdHousing;
  wash: HouseholdWASH;
  energyAssets: HouseholdEnergyAssets;
  location: HouseholdLocation;
  povertyLevel: PovertyLevel;
  surveyDate: string;
  surveyorName: string;
  status: 'completed' | 'draft' | 'verified';
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

export interface VillageInfo {
  villageNameKhmer: string;
  villageNameLatin: string;
  villageCode: string;
  communeName: string;
  districtName: string;
  provinceName: string;
  villageChiefName: string;
  villageChiefPhone: string;
  surveyorName: string;
  surveyYear: number;
  totalGroupsCount: number;
}

export interface SyncQueueItem {
  id: string;
  householdId: string;
  action: 'create' | 'update' | 'delete';
  data?: Household;
  timestamp: number;
}

export interface VillageCensusSummary {
  totalHouseholds: number;
  totalPopulation: number;
  totalMales: number;
  totalFemales: number;
  childrenUnder18: number;
  childrenUnder5: number;
  workingAge: number; // 18 - 59
  elderly60Plus: number;
  femaleHeadedHouseholds: number;
  povertyStats: {
    idpoor1: number;
    idpoor2: number;
    vulnerable: number;
    nonPoor: number;
  };
  washStats: {
    hasLatrineCount: number;
    hasLatrinePercent: number;
    cleanWaterCount: number;
    cleanWaterPercent: number;
  };
  energyStats: {
    nationalGridCount: number;
    solarCount: number;
    batteryCount: number;
    noElectricityCount: number;
  };
  educationStats: Record<string, number>;
  occupationStats: Record<string, number>;
  agricultureStats: {
    totalFarmLandHectares: number;
    totalCattle: number;
    totalKoyon: number;
  };
  groupsBreakdown: Array<{
    groupNumber: string;
    householdCount: number;
    populationCount: number;
    males: number;
    females: number;
  }>;
}
