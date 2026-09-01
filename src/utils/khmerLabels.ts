import { EducationLevel, Gender, MaritalStatus, PovertyLevel, Relationship } from '../types';

export const GENDER_LABELS: Record<Gender, { km: string; en: string; color: string }> = {
  male: { km: 'ប្រុស', en: 'Male', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  female: { km: 'ស្រី', en: 'Female', color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

export const RELATIONSHIP_LABELS: Record<Relationship, { km: string; en: string }> = {
  head: { km: 'មេគ្រួសារ', en: 'Household Head' },
  spouse: { km: 'ប្រពន្ធ / ប្តី', en: 'Spouse' },
  child: { km: 'កូន', en: 'Child' },
  parent: { km: 'ឪពុក / ម្តាយ', en: 'Parent' },
  grandchild: { km: 'ចៅ', en: 'Grandchild' },
  sibling: { km: 'បងប្អូន', en: 'Sibling' },
  relative: { km: 'សាច់ញាតិ', en: 'Relative' },
  other: { km: 'ផ្សេងៗ', en: 'Other' },
};

export const MARITAL_LABELS: Record<MaritalStatus, { km: string; en: string }> = {
  single: { km: 'នៅលីវ', en: 'Single' },
  married: { km: 'រៀបការ/មានគូ', en: 'Married' },
  widowed: { km: 'មេម៉ាយ/ពោះម៉ាយ', en: 'Widowed' },
  divorced: { km: 'លែងលះ', en: 'Divorced' },
};

export const EDUCATION_LABELS: Record<EducationLevel, { km: string; en: string }> = {
  none: { km: 'មិនបានរៀន/អនក្ខរជន', en: 'No Formal Education' },
  primary_incomplete: { km: 'បឋមមិនចប់ (ថ្នាក់ទី ១-៥)', en: 'Incomplete Primary' },
  primary: { km: 'ចប់បឋមសិក្សា (ថ្នាក់ទី ៦)', en: 'Primary (Grade 6)' },
  secondary: { km: 'អនុវិទ្យាល័យ (ថ្នាក់ទី ៧-៩)', en: 'Lower Secondary' },
  highschool: { km: 'វិទ្យាល័យ (ថ្នាក់ទី ១០-១២)', en: 'Upper Secondary' },
  vocational: { km: 'បណ្តុះបណ្តាលវិជ្ជាជីវៈ/បច្ចេកទេស', en: 'Vocational Training' },
  bachelor_plus: { km: 'បរិញ្ញាបត្រ ឬខ្ពស់ជាង', en: 'Higher Education' },
  monk: { km: 'បួសរៀន/ពុទ្ធិកសិក្សា', en: 'Buddhist Education' },
};

export const POVERTY_LABELS: Record<PovertyLevel, { km: string; en: string; badgeClass: string; description: string }> = {
  idpoor_1: {
    km: 'ក្រ១ (ក្រីក្រខ្លាំង)',
    en: 'IDPoor 1 (Very Poor)',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    description: 'គ្រួសារក្រីក្រកម្រិត ១ មានប័ណ្ណសមធម៌ក្រហម'
  },
  idpoor_2: {
    km: 'ក្រ២ (ក្រីក្រមធ្យម)',
    en: 'IDPoor 2 (Poor)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'គ្រួសារក្រីក្រកម្រិត ២ មានប័ណ្ណសមធម៌ខៀវ'
  },
  vulnerable: {
    km: 'ងាយរងគ្រោះ',
    en: 'Vulnerable',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'គ្រួសារងាយរងគ្រោះ (ចាស់ជរាគ្មានទីពឹង, ពិការភាព, ស្ត្រីមេម៉ាយ)'
  },
  non_poor: {
    km: 'ជីវភាពធម្មតា (មិនក្រីក្រ)',
    en: 'Non-Poor (Normal)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'គ្រួសារដែលមានជីវភាពសមរម្យ'
  },
};

export const ROOF_LABELS: Record<string, string> = {
  tin: 'ស័ង្កសី (Zinc/Tin)',
  tile: 'ក្បឿង (Tiles)',
  concrete: 'បេតុង (Concrete)',
  thatch: 'ស្លឹក/ស្បូវ (Thatch/Leaves)',
  other: 'ផ្សេងទៀត (Other)',
};

export const WALL_LABELS: Record<string, string> = {
  wood: 'ឈើបន្ទះ (Wood)',
  brick_concrete: 'ឥដ្ឋ/បេតុង (Brick/Concrete)',
  zinc: 'ស័ង្កសី (Zinc)',
  bamboo_thatch: 'ឬស្សី/ស្លឹក (Bamboo/Thatch)',
  other: 'ផ្សេងទៀត (Other)',
};

export const WATER_LABELS: Record<string, string> = {
  pipe_water: 'ទឹកម៉ាស៊ីន/រដ្ឋាករទឹក',
  pump_well: 'អណ្តូងស្នប់',
  dug_well: 'អណ្តូងជីក (មានគម្រប)',
  pond_rain: 'ស្រះទឹក / ទឹកភ្លៀង (ពាង)',
  purchased: 'ទិញពីឡានទឹក',
  stream: 'ស្ទឹង/ព្រែក/បឹងធម្មជាតិ',
  other: 'ផ្សេងៗ',
};

export const ELECTRICITY_LABELS: Record<string, string> = {
  national_grid: 'បណ្តាញអគ្គិសនីរដ្ឋ (EDC)',
  solar: 'ថាមពលព្រះអាទិត្យ (សូឡា)',
  battery: 'អាគុយសាក',
  generator: 'ម៉ាស៊ីនភ្លើង',
  none: 'គ្មាន (ប្រើចង្កៀង/ពិល)',
};

export const LATRINE_LABELS: Record<string, string> = {
  pour_flush: 'បង្គន់ចាក់ទឹក (មានអាង)',
  dry_pit: 'បង្គន់រណ្តៅស្ងួត',
  shared: 'ប្រើរួមជាមួយអ្នកជិតខាង',
  none: 'គ្មានបង្គន់អនាម័យ',
};

// Helper to convert Arabic numbers to Khmer numerals if needed
export function toKhmerNum(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (w) => khmerDigits[+w]);
}

// Calculate age from birthdate
export function calculateAge(dobString?: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// Common occupations for quick selection in Khmer census
export const POPULAR_OCCUPATIONS = [
  'កសិករ (ធ្វើស្រែចម្ការ)',
  'កម្មកររោងចក្រកាត់ដេរ',
  'អាជីវករ/លក់ដូរ',
  'សំណង់/ជាងសំណង់',
  'គ្រូបង្រៀន',
  'មន្ត្រីរាជការ',
  'នគរបាល/កងកម្លាំង',
  'អ្នករត់ម៉ូតូឌុប/កង់បី',
  'សិស្ស/និស្សិត',
  'ចាស់ជរាក្នុងបន្ទុក',
  'កុមារតូចក្នុងបន្ទុក',
  'មេផ្ទះ',
  'នេសាទ',
  'ចិញ្ចឹមសត្វ',
  'គ្មានការងារធ្វើ',
];
