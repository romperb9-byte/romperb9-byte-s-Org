import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  MapPin, 
  Users, 
  Home, 
  Droplets, 
  Zap, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Calendar,
  Phone,
  User,
  Sparkles
} from 'lucide-react';
import { 
  EducationLevel, 
  Gender, 
  Household, 
  MaritalStatus, 
  PersonMember, 
  PovertyLevel, 
  Relationship, 
  VillageInfo 
} from '../types';
import { 
  EDUCATION_LABELS, 
  GENDER_LABELS, 
  MARITAL_LABELS, 
  POPULAR_OCCUPATIONS, 
  POVERTY_LABELS, 
  RELATIONSHIP_LABELS, 
  calculateAge, 
  toKhmerNum 
} from '../utils/khmerLabels';

interface HouseholdFormViewProps {
  village: VillageInfo;
  initialHousehold?: Household | null;
  existingHouseholds: Household[];
  onSave: (household: Household) => void;
  onCancel: () => void;
}

export const HouseholdFormView: React.FC<HouseholdFormViewProps> = ({
  village,
  initialHousehold,
  existingHouseholds,
  onSave,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Generate next default code
  const getNextCode = () => {
    const count = existingHouseholds.length + 1;
    const padded = String(count).padStart(3, '0');
    return `ភ-០១-${padded}`;
  };

  // Form State
  const [householdCode, setHouseholdCode] = useState(initialHousehold?.householdCode || getNextCode());
  const [groupNumber, setGroupNumber] = useState(initialHousehold?.location.groupNumber || '១');
  const [houseNumber, setHouseNumber] = useState(initialHousehold?.location.houseNumber || '');
  const [streetOrLocation, setStreetOrLocation] = useState(initialHousehold?.location.streetOrLocationName || '');
  const [latitude, setLatitude] = useState<number | undefined>(initialHousehold?.location.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialHousehold?.location.longitude);
  const [surveyDate, setSurveyDate] = useState(initialHousehold?.surveyDate || new Date().toISOString().split('T')[0]);
  const [surveyorName, setSurveyorName] = useState(initialHousehold?.surveyorName || village.surveyorName);
  const [povertyLevel, setPovertyLevel] = useState<PovertyLevel>(initialHousehold?.povertyLevel || 'non_poor');

  // Housing state
  const [roofType, setRoofType] = useState(initialHousehold?.housing.roofType || 'tin');
  const [wallType, setWallType] = useState(initialHousehold?.housing.wallType || 'wood');
  const [floorType, setFloorType] = useState(initialHousehold?.housing.floorType || 'wood');
  const [houseOwnership, setHouseOwnership] = useState(initialHousehold?.housing.houseOwnership || 'owned');
  const [houseCondition, setHouseCondition] = useState(initialHousehold?.housing.houseCondition || 'medium');

  // WASH state
  const [waterSourceDry, setWaterSourceDry] = useState(initialHousehold?.wash.waterSourceDry || 'pipe_water');
  const [waterSourceWet, setWaterSourceWet] = useState(initialHousehold?.wash.waterSourceWet || 'pipe_water');
  const [hasLatrine, setHasLatrine] = useState(initialHousehold?.wash.hasLatrine ?? true);
  const [latrineType, setLatrineType] = useState(initialHousehold?.wash.latrineType || 'pour_flush');
  const [wasteManagement, setWasteManagement] = useState(initialHousehold?.wash.wasteManagement || 'burn');

  // Energy & Assets state
  const [electricitySource, setElectricitySource] = useState(initialHousehold?.energyAssets.electricitySource || 'national_grid');
  const [hasMotorbike, setHasMotorbike] = useState(initialHousehold?.energyAssets.hasMotorbike || 1);
  const [hasBicycle, setHasBicycle] = useState(initialHousehold?.energyAssets.hasBicycle || 1);
  const [hasCarOrTruck, setHasCarOrTruck] = useState(initialHousehold?.energyAssets.hasCarOrTruck || 0);
  const [hasKoyonTiller, setHasKoyonTiller] = useState(initialHousehold?.energyAssets.hasKoyonTiller || 0);
  const [hasBoat, setHasBoat] = useState(initialHousehold?.energyAssets.hasBoat || 0);
  const [farmLandHectares, setFarmLandHectares] = useState(initialHousehold?.energyAssets.agriculturalLandHectares || 0.5);
  const [residentialLandSqm, setResidentialLandSqm] = useState(initialHousehold?.energyAssets.residentialLandSqm || 300);
  const [cowsAndBuffalos, setCowsAndBuffalos] = useState(initialHousehold?.energyAssets.cowsAndBuffalos || 0);
  const [pigs, setPigs] = useState(initialHousehold?.energyAssets.pigs || 0);
  const [poultry, setPoultry] = useState(initialHousehold?.energyAssets.poultry || 10);

  // Members state
  const [members, setMembers] = useState<PersonMember[]>(
    initialHousehold?.members || [
      {
        id: `mem-${Date.now()}-1`,
        fullNameKhmer: '',
        fullNameLatin: '',
        gender: 'male',
        relationship: 'head',
        dob: '1985-01-01',
        age: 41,
        nationalId: '',
        maritalStatus: 'married',
        educationLevel: 'secondary',
        primaryOccupation: 'កសិករ (ធ្វើស្រែចម្ការ)',
        hasDisability: false,
        hasNSSF: false,
        hasIDPoorCard: false,
        isHead: true,
        phone: '',
      },
    ]
  );

  // Handle GPS location capture
  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setLocationError('កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រ GPS ទេ');
      return;
    }
    setIsGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsGettingLocation(false);
      },
      (err) => {
        setLocationError(`មិនអាចចាប់យក GPS បានទេ (${err.message})`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Add new member
  const handleAddMember = () => {
    const newMem: PersonMember = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      fullNameKhmer: '',
      fullNameLatin: '',
      gender: 'female',
      relationship: 'child',
      dob: '2010-01-01',
      age: 16,
      nationalId: '',
      maritalStatus: 'single',
      educationLevel: 'primary',
      primaryOccupation: 'សិស្ស/និស្សិត',
      hasDisability: false,
      hasNSSF: false,
      hasIDPoorCard: povertyLevel === 'idpoor_1' || povertyLevel === 'idpoor_2',
      isHead: false,
      phone: '',
    };
    setMembers([...members, newMem]);
  };

  // Update member field
  const handleUpdateMember = (index: number, field: keyof PersonMember, value: any) => {
    const updated = [...members];
    const item = { ...updated[index], [field]: value };

    // Auto calculate age if DOB updated
    if (field === 'dob') {
      item.age = calculateAge(value);
    }

    // If marked as head, unmark other heads
    if (field === 'relationship' && value === 'head') {
      updated.forEach((m, i) => {
        if (i !== index && m.relationship === 'head') {
          m.relationship = 'spouse';
          m.isHead = false;
        }
      });
      item.isHead = true;
    }

    updated[index] = item;
    setMembers(updated);
  };

  // Remove member
  const handleRemoveMember = (index: number) => {
    if (members.length === 1) {
      alert('គ្រួសារត្រូវតែមានសមាជិកយ៉ាងហោចណាស់ម្នាក់ (មេគ្រួសារ)!');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  // Save Household
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Find head
    const headMember = members.find((m) => m.relationship === 'head' || m.isHead) || members[0];
    if (!headMember.fullNameKhmer.trim()) {
      alert('សូមបញ្ចូលឈ្មោះមេគ្រួសារ (សមាជិកទី១)!');
      setActiveStep(2);
      return;
    }

    const newOrUpdatedHh: Household = {
      id: initialHousehold?.id || `hh-${Date.now()}`,
      householdCode: householdCode.trim() || getNextCode(),
      headName: headMember.fullNameKhmer,
      headGender: headMember.gender,
      headAge: headMember.age,
      headPhone: headMember.phone || '',
      members,
      housing: {
        roofType,
        wallType,
        floorType,
        houseOwnership,
        houseCondition,
      },
      wash: {
        waterSourceDry,
        waterSourceWet,
        hasLatrine,
        latrineType: hasLatrine ? latrineType : 'none',
        wasteManagement,
      },
      energyAssets: {
        electricitySource,
        hasMotorbike: Number(hasMotorbike) || 0,
        hasBicycle: Number(hasBicycle) || 0,
        hasCarOrTruck: Number(hasCarOrTruck) || 0,
        hasKoyonTiller: Number(hasKoyonTiller) || 0,
        hasBoat: Number(hasBoat) || 0,
        agriculturalLandHectares: Number(farmLandHectares) || 0,
        residentialLandSqm: Number(residentialLandSqm) || 0,
        cowsAndBuffalos: Number(cowsAndBuffalos) || 0,
        pigs: Number(pigs) || 0,
        poultry: Number(poultry) || 0,
      },
      location: {
        groupNumber,
        houseNumber,
        streetOrLocationName: streetOrLocation,
        latitude,
        longitude,
      },
      povertyLevel,
      surveyDate,
      surveyorName: surveyorName || village.surveyorName,
      status: 'verified',
      createdAt: initialHousehold?.createdAt || Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',
      version: (initialHousehold?.version || 0) + 1,
    };

    onSave(newOrUpdatedHh);
  };

  const steps = [
    { num: 1, title: '១. ទីតាំង & កាលបរិច្ឆេទ', icon: MapPin },
    { num: 2, title: '២. សមាជិកគ្រួសារ', icon: Users },
    { num: 3, title: '៣. ផ្ទះ & អនាម័យ', icon: Droplets },
    { num: 4, title: '៤. ថាមពល & កសិកម្ម', icon: Zap },
    { num: 5, title: '៥. ជីវភាព & បញ្ជាក់', icon: ShieldCheck },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Form Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-khmer-title flex items-center gap-2">
            <span>{initialHousehold ? 'កែប្រែទិន្នន័យជំរឿនគ្រួសារ' : 'ទម្រង់បែបបទស្រង់ស្ថិតិជំរឿនគ្រួសារថ្មី'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {village.villageNameKhmer} • {village.communeName} {village.districtName}
          </p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="បិទ"
        >
          <X size={20} />
        </button>
      </div>

      {/* Step Navigation Bar */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Icon size={14} />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* STEP 1: General Info & Location */}
        {activeStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 font-khmer-title border-b border-slate-200 pb-2 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" />
              <span>ព័ត៌មានទូទៅ និងទីតាំងភូមិសាស្ត្រ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  លេខកូដគ្រួសារ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={householdCode}
                  onChange={(e) => setHouseholdCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឧ. ភ-០១-០០១"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ក្រុមទី <span className="text-red-500">*</span>
                </label>
                <select
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: village.totalGroupsCount || 5 }, (_, i) => String(i + 1)).map((g) => (
                    <option key={g} value={g}>
                      ក្រុមទី {toKhmerNum(g)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ផ្ទះលេខ (បើមាន)
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឧ. ១២A"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អាសយដ្ឋានពិស្តារ ឬចំណុចសម្គាល់ក្នុងភូមិ
                </label>
                <input
                  type="text"
                  value={streetOrLocation}
                  onChange={(e) => setStreetOrLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឧ. ផ្លូវបេតុងខាងលិចវត្ត, ជាប់មាត់ព្រែក, ទល់មុខសាលាឆទាន..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  កាលបរិច្ឆេទស្រង់ស្ថិតិ
                </label>
                <input
                  type="date"
                  value={surveyDate}
                  onChange={(e) => setSurveyDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ឈ្មោះអ្នកស្រង់ស្ថិតិ
                </label>
                <input
                  type="text"
                  value={surveyorName}
                  onChange={(e) => setSurveyorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* GPS Geolocation capture button */}
              <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800">
                    កូអរដោនេទីតាំងផ្ទះ (GPS Coordinates)
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCoordinates}
                    disabled={isGettingLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                  >
                    <MapPin size={13} />
                    <span>{isGettingLocation ? 'កំពុងចាប់ទីតាំង...' : 'ចាប់យក GPS ទីតាំងជាក់ស្តែង'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">រយៈទទឹង (Latitude): </span>
                    <strong className="text-slate-900 font-mono">{latitude ?? 'មិនទាន់ចាប់'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">រយៈបណ្តោយ (Longitude): </span>
                    <strong className="text-slate-900 font-mono">{longitude ?? 'មិនទាន់ចាប់'}</strong>
                  </div>
                </div>
                {locationError && <p className="text-xs text-red-600">{locationError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Members Registry */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900 font-khmer-title flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <span>បញ្ជីសមាជិកគ្រួសារ ({toKhmerNum(members.length)} នាក់)</span>
              </h3>

              <button
                type="button"
                onClick={handleAddMember}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
              >
                <Plus size={14} />
                <span>+ បន្ថែមសមាជិក</span>
              </button>
            </div>

            <div className="space-y-4">
              {members.map((member, index) => {
                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      member.relationship === 'head' || member.isHead
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                          {toKhmerNum(index + 1)}
                        </span>
                        <span className="text-sm font-bold text-slate-900 font-khmer-title">
                          {member.relationship === 'head' || member.isHead ? 'មេគ្រួសារ (Household Head)' : `សមាជិកទី ${toKhmerNum(index + 1)}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title="លុបសមាជិកនេះ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {/* Name in Khmer */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          គោត្តនាម និងនាម <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={member.fullNameKhmer}
                          onChange={(e) => handleUpdateMember(index, 'fullNameKhmer', e.target.value)}
                          placeholder="ឧ. ស៊ឹម សុខា"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Name in Latin */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          ឈ្មោះឡាតាំង (ជាអក្សរធំ)
                        </label>
                        <input
                          type="text"
                          value={member.fullNameLatin || ''}
                          onChange={(e) => handleUpdateMember(index, 'fullNameLatin', e.target.value)}
                          placeholder="SIM SOKHA"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ភេទ</label>
                        <select
                          value={member.gender}
                          onChange={(e) => handleUpdateMember(index, 'gender', e.target.value as Gender)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="male">ប្រុស (Male)</option>
                          <option value="female">ស្រី (Female)</option>
                        </select>
                      </div>

                      {/* Relationship */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          ត្រូវជាអ្វីជាមួយមេគ្រួសារ
                        </label>
                        <select
                          value={member.relationship}
                          onChange={(e) => handleUpdateMember(index, 'relationship', e.target.value as Relationship)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.km}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* DOB */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ថ្ងៃខែឆ្នាំកំណើត</label>
                        <input
                          type="date"
                          value={member.dob || ''}
                          onChange={(e) => handleUpdateMember(index, 'dob', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">អាយុ (ឆ្នាំ)</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={member.age}
                          onChange={(e) => handleUpdateMember(index, 'age', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* National ID */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          អត្តសញ្ញាណប័ណ្ណ / សំបុត្រកំណើត
                        </label>
                        <input
                          type="text"
                          value={member.nationalId || ''}
                          onChange={(e) => handleUpdateMember(index, 'nationalId', e.target.value)}
                          placeholder="ឧ. 080201948"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Marital Status */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ស្ថានភាពគ្រួសារ</label>
                        <select
                          value={member.maritalStatus}
                          onChange={(e) => handleUpdateMember(index, 'maritalStatus', e.target.value as MaritalStatus)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(MARITAL_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.km}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Education Level */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">កម្រិតវប្បធម៌</label>
                        <select
                          value={member.educationLevel}
                          onChange={(e) => handleUpdateMember(index, 'educationLevel', e.target.value as EducationLevel)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(EDUCATION_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.km}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Primary Occupation */}
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">មុខរបរចម្បង</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={member.primaryOccupation}
                            onChange={(e) => handleUpdateMember(index, 'primaryOccupation', e.target.value)}
                            list={`occupations-${index}`}
                            placeholder="ឧ. កសិករ, កម្មកររោងចក្រ..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          <datalist id={`occupations-${index}`}>
                            {POPULAR_OCCUPATIONS.map((occ) => (
                              <option key={occ} value={occ} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Social & Health protections */}
                      <div className="sm:col-span-4 flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.hasNSSF}
                            onChange={(e) => handleUpdateMember(index, 'hasNSSF', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs text-slate-700 font-medium">មានប័ណ្ណ ប.ស.ស (NSSF)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.hasIDPoorCard}
                            onChange={(e) => handleUpdateMember(index, 'hasIDPoorCard', e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="text-xs text-slate-700 font-medium">មានប័ណ្ណសមធម៌ (IDPoor)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={member.hasDisability}
                            onChange={(e) => handleUpdateMember(index, 'hasDisability', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-xs text-slate-700 font-medium">មានពិការភាព</span>
                        </label>

                        {member.hasDisability && (
                          <input
                            type="text"
                            placeholder="បញ្ជាក់ប្រភេទពិការភាព..."
                            value={member.disabilityType || ''}
                            onChange={(e) => handleUpdateMember(index, 'disabilityType', e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs w-48"
                          />
                        )}

                        <div className="ml-auto">
                          <input
                            type="text"
                            placeholder="លេខទូរស័ព្ទផ្ទាល់ខ្លួន..."
                            value={member.phone || ''}
                            onChange={(e) => handleUpdateMember(index, 'phone', e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs w-40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Housing & WASH */}
        {activeStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 font-khmer-title border-b border-slate-200 pb-2 flex items-center gap-2">
              <Droplets size={18} className="text-teal-600" />
              <span>ស្ថានភាពលំនៅដ្ឋាន និងបរិស្ថានអនាម័យ (WASH)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភេទដំបូល</label>
                <select
                  value={roofType}
                  onChange={(e: any) => setRoofType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tin">ស័ង្កសី (Zinc/Tin)</option>
                  <option value="tile">ក្បឿង (Tiles)</option>
                  <option value="concrete">បេតុង (Concrete)</option>
                  <option value="thatch">ស្លឹក/ស្បូវ (Thatch)</option>
                  <option value="other">ផ្សេងទៀត (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភេទជញ្ជាំង</label>
                <select
                  value={wallType}
                  onChange={(e: any) => setWallType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="wood">ឈើបន្ទះ (Wood)</option>
                  <option value="brick_concrete">ឥដ្ឋ/បេតុង (Brick/Concrete)</option>
                  <option value="zinc">ស័ង្កសី (Zinc)</option>
                  <option value="bamboo_thatch">ឬស្សី/ស្លឹក (Bamboo/Thatch)</option>
                  <option value="other">ផ្សេងទៀត (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ស្ថានភាពផ្ទះ</label>
                <select
                  value={houseCondition}
                  onChange={(e: any) => setHouseCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="good">ល្អរឹងមាំ</option>
                  <option value="medium">មធ្យម</option>
                  <option value="dilapidated">ទ្រុឌទ្រោម</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភពទឹកប្រើប្រាស់ (រដូវប្រាំង)</label>
                <select
                  value={waterSourceDry}
                  onChange={(e: any) => setWaterSourceDry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pipe_water">ទឹកម៉ាស៊ីន/រដ្ឋាករទឹក</option>
                  <option value="pump_well">អណ្តូងស្នប់</option>
                  <option value="dug_well">អណ្តូងជីក</option>
                  <option value="pond_rain">ស្រះទឹក / ទឹកភ្លៀង</option>
                  <option value="purchased">ទិញពីឡានទឹក</option>
                  <option value="stream">ស្ទឹង/ព្រែក</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភពទឹកប្រើប្រាស់ (រដូវវស្សា)</label>
                <select
                  value={waterSourceWet}
                  onChange={(e: any) => setWaterSourceWet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pipe_water">ទឹកម៉ាស៊ីន/រដ្ឋាករទឹក</option>
                  <option value="pond_rain">ទឹកភ្លៀង (ពាងទឹក)</option>
                  <option value="pump_well">អណ្តូងស្នប់</option>
                  <option value="dug_well">អណ្តូងជីក</option>
                  <option value="stream">ស្ទឹង/ព្រែក</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ការចោលសំរាម</label>
                <select
                  value={wasteManagement}
                  onChange={(e: any) => setWasteManagement(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="burn">ដុតក្នុងដីផ្ទះ</option>
                  <option value="bury">កប់ក្នុងដី</option>
                  <option value="collection_service">សេវាប្រមូលសំរាម</option>
                  <option value="open_dump">ចាក់គរចោល</option>
                </select>
              </div>

              {/* Latrine check */}
              <div className="sm:col-span-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLatrine}
                    onChange={(e) => setHasLatrine(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-800">
                    គ្រួសារមានបង្គន់អនាម័យប្រើប្រាស់ផ្ទាល់ខ្លួន
                  </span>
                </label>

                {hasLatrine && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">ប្រភេទបង្គន់:</span>
                    <select
                      value={latrineType}
                      onChange={(e: any) => setLatrineType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-xs"
                    >
                      <option value="pour_flush">បង្គន់ចាក់ទឹក (មានអាងស្តុក)</option>
                      <option value="dry_pit">បង្គន់រណ្តៅស្ងួត</option>
                      <option value="shared">ប្រើរួមជាមួយអ្នកជិតខាង</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Energy & Agriculture */}
        {activeStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 font-khmer-title border-b border-slate-200 pb-2 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <span>ថាមពល និងទ្រព្យសម្បត្តិកសិកម្ម</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភពអគ្គិសនីប្រើប្រាស់</label>
                <select
                  value={electricitySource}
                  onChange={(e: any) => setElectricitySource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="national_grid">បណ្តាញអគ្គិសនីរដ្ឋ (EDC)</option>
                  <option value="solar">ថាមពលព្រះអាទិត្យ (សូឡា)</option>
                  <option value="battery">អាគុយសាក</option>
                  <option value="generator">ម៉ាស៊ីនភ្លើង</option>
                  <option value="none">គ្មាន (ប្រើចង្កៀង/ពិល)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ដីស្រែ/ចម្ការ (ហិកតា)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={farmLandHectares}
                  onChange={(e) => setFarmLandHectares(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ដីភូមិ/លំនៅដ្ឋាន (ម²)</label>
                <input
                  type="number"
                  min="0"
                  value={residentialLandSqm}
                  onChange={(e) => setResidentialLandSqm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {/* Vehicles */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ម៉ូតូ (គ្រឿង)</label>
                <input
                  type="number"
                  min="0"
                  value={hasMotorbike}
                  onChange={(e) => setHasMotorbike(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">កង់ (គ្រឿង)</label>
                <input
                  type="number"
                  min="0"
                  value={hasBicycle}
                  onChange={(e) => setHasBicycle(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">គោយន្ត (គ្រឿង)</label>
                <input
                  type="number"
                  min="0"
                  value={hasKoyonTiller}
                  onChange={(e) => setHasKoyonTiller(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">រថយន្ត/ឡាន (គ្រឿង)</label>
                <input
                  type="number"
                  min="0"
                  value={hasCarOrTruck}
                  onChange={(e) => setHasCarOrTruck(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {/* Livestock */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">គោ/ក្របី (ក្បាល)</label>
                <input
                  type="number"
                  min="0"
                  value={cowsAndBuffalos}
                  onChange={(e) => setCowsAndBuffalos(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ជ្រូក (ក្បាល)</label>
                <input
                  type="number"
                  min="0"
                  value={pigs}
                  onChange={(e) => setPigs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">មាន់/ទា (ក្បាល)</label>
                <input
                  type="number"
                  min="0"
                  value={poultry}
                  onChange={(e) => setPoultry(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ទូក/កាណូត (គ្រឿង)</label>
                <input
                  type="number"
                  min="0"
                  value={hasBoat}
                  onChange={(e) => setHasBoat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Poverty & Confirmation */}
        {activeStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 font-khmer-title border-b border-slate-200 pb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>ការកំណត់កម្រិតជីវភាព និងការផ្ទៀងផ្ទាត់</span>
            </h3>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                ចំណាត់ថ្នាក់កម្រិតជីវភាពគ្រួសារ (Poverty Classification)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(POVERTY_LABELS).map(([key, item]) => {
                  const isSelected = povertyLevel === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setPovertyLevel(key as PovertyLevel)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{item.km}</span>
                        {isSelected && <Check size={18} className="text-blue-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Summary of entries */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 mt-4">
                <div className="font-bold text-slate-900 mb-1">សេចក្តីសង្ខេបមុនពេលរក្សាទុក៖</div>
                <div>• កូដគ្រួសារ: <strong>{householdCode}</strong> (ក្រុមទី {toKhmerNum(groupNumber)})</div>
                <div>• មេគ្រួសារ: <strong>{members.find((m) => m.relationship === 'head' || m.isHead)?.fullNameKhmer || 'មិនទាន់បញ្ចូល'}</strong></div>
                <div>• ចំនួនសមាជិកគ្រួសារ: <strong>{toKhmerNum(members.length)} នាក់</strong></div>
                <div>• ប្រភពទឹក: <strong>{waterSourceDry}</strong> • បង្គន់: <strong>{hasLatrine ? 'មាន' : 'គ្មាន'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Form Footer Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                ← ថយក្រោយ
              </button>
            )}
            {activeStep < 5 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                បន្ទាប់ →
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              បោះបង់
            </button>

            <button
              type="submit"
              id="btn-save-census-survey"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              <Save size={16} />
              <span>រក្សាទុកទិន្នន័យ (Save)</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
