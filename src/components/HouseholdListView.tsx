import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Edit3, 
  Trash2, 
  Eye, 
  MapPin, 
  Download, 
  Phone, 
  Users, 
  CheckCircle, 
  Clock, 
  Building,
  Droplets,
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Household, VillageInfo } from '../types';
import { GENDER_LABELS, POVERTY_LABELS, toKhmerNum } from '../utils/khmerLabels';
import { storageService } from '../services/storage';

interface HouseholdListViewProps {
  village: VillageInfo;
  households: Household[];
  onSelectHousehold: (household: Household) => void;
  onEditHousehold: (household: Household) => void;
  onDeleteHousehold: (id: string) => void;
  onNewSurvey: () => void;
  onExportCSV: () => void;
  onNavigateToMap?: (household?: Household) => void;
}

export const HouseholdListView: React.FC<HouseholdListViewProps> = ({
  village,
  households,
  onSelectHousehold,
  onEditHousehold,
  onDeleteHousehold,
  onNewSurvey,
  onExportCSV,
  onNavigateToMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedPoverty, setSelectedPoverty] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter households
  const filteredHouseholds = households.filter((h) => {
    // Search matches code, head name, phone, member names
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const codeMatch = h.householdCode.toLowerCase().includes(q);
      const headMatch = h.headName.toLowerCase().includes(q);
      const phoneMatch = (h.headPhone || '').includes(q);
      const memberMatch = h.members.some(
        (m) =>
          m.fullNameKhmer.toLowerCase().includes(q) ||
          (m.fullNameLatin && m.fullNameLatin.toLowerCase().includes(q)) ||
          (m.nationalId && m.nationalId.includes(q))
      );
      if (!codeMatch && !headMatch && !phoneMatch && !memberMatch) return false;
    }

    // Group filter
    if (selectedGroup !== 'all' && h.location.groupNumber !== selectedGroup) {
      return false;
    }

    // Poverty filter
    if (selectedPoverty !== 'all' && h.povertyLevel !== selectedPoverty) {
      return false;
    }

    // Gender of head filter
    if (selectedGender !== 'all' && h.headGender !== selectedGender) {
      return false;
    }

    return true;
  });

  // Extract unique groups available
  const availableGroups: string[] = Array.from(new Set<string>(households.map((h) => String(h.location.groupNumber || '')))).sort((a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  return (
    <div className="space-y-5">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-khmer-title">
            បញ្ជីឈ្មោះគ្រួសារ និងជំរឿនប្រជាជន
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            មានសរុប {toKhmerNum(households.length)} គ្រួសារ (បង្ហាញ {toKhmerNum(filteredHouseholds.length)} គ្រួសារ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-200 transition-all border border-slate-200"
            title="ទាញយកទិន្នន័យជាឯកសារ Excel / CSV"
          >
            <Download size={15} />
            <span>ទាញយក CSV/Excel</span>
          </button>

          <button
            id="btn-add-new-survey"
            onClick={onNewSurvey}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-all shadow-xs"
          >
            <Plus size={16} />
            <span>+ ស្រង់ស្ថិតិថ្មី</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-census"
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះមេគ្រួសារ, សមាជិក, កូដ, ទូរស័ព្ទ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              id="select-filter-group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">គ្រប់ក្រុមទាំងអស់</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>
                  ក្រុមទី {toKhmerNum(g)}
                </option>
              ))}
            </select>
          </div>

          {/* Poverty Level Filter */}
          <div>
            <select
              id="select-filter-poverty"
              value={selectedPoverty}
              onChange={(e) => setSelectedPoverty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">គ្រប់កម្រិតជីវភាព</option>
              <option value="idpoor_1">ក្រ១ (ក្រីក្រខ្លាំង)</option>
              <option value="idpoor_2">ក្រ២ (ក្រីក្រមធ្យម)</option>
              <option value="vulnerable">ងាយរងគ្រោះ</option>
              <option value="non_poor">ជីវភាពធម្មតា</option>
            </select>
          </div>
        </div>

        {/* Sub-Filters & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">ភេទមេគ្រួសារ:</span>
            <button
              onClick={() => setSelectedGender('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedGender === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ទាំងអស់
            </button>
            <button
              onClick={() => setSelectedGender('male')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedGender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ប្រុស ({toKhmerNum(households.filter((h) => h.headGender === 'male').length)})
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedGender === 'female' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ស្រី ({toKhmerNum(households.filter((h) => h.headGender === 'female').length)})
            </button>
          </div>

          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-xs font-medium ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500'
              }`}
            >
              តារាង
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 rounded text-xs font-medium ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500'
              }`}
            >
              ប័ណ្ណ
            </button>
          </div>
        </div>
      </div>

      {/* Household Data Listing */}
      {filteredHouseholds.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-khmer-title">មិនមានទិន្នន័យត្រូវស្វែងរកទេ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            សូមព្យាយាមផ្លាស់ប្តូរពាក្យស្វែងរក ឬកម្រងចម្រោះខាងលើ ដើម្បីស្វែងរកគ្រួសារដែលចង់បាន។
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">កូដគ្រួសារ</th>
                  <th className="px-4 py-3.5">មេគ្រួសារ</th>
                  <th className="px-4 py-3.5">ក្រុម/ទីតាំង</th>
                  <th className="px-4 py-3.5">សមាជិក</th>
                  <th className="px-4 py-3.5">កម្រិតជីវភាព</th>
                  <th className="px-4 py-3.5">អនាម័យ & ថាមពល</th>
                  <th className="px-4 py-3.5">ស្ថានភាព</th>
                  <th className="px-4 py-3.5 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHouseholds.map((hh) => {
                  const pov = POVERTY_LABELS[hh.povertyLevel];
                  const genderInfo = GENDER_LABELS[hh.headGender];

                  return (
                    <tr key={hh.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {toKhmerNum(hh.householdCode)}
                      </td>

                      {/* Head info */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{hh.headName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${genderInfo.color}`}>
                            {genderInfo.km}
                          </span>
                          <span>{toKhmerNum(hh.headAge)} ឆ្នាំ</span>
                          {hh.headPhone && (
                            <>
                              <span>•</span>
                              <span>{hh.headPhone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Group and address */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          ក្រុមទី {toKhmerNum(hh.location.groupNumber)}
                        </span>
                        {hh.location.houseNumber && (
                          <span className="text-xs text-slate-500 block mt-0.5">
                            ផ្ទះលេខ {toKhmerNum(hh.location.houseNumber)}
                          </span>
                        )}
                      </td>

                      {/* Members count */}
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-slate-400" />
                          <span>{toKhmerNum(hh.members.length)} នាក់</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          (ប្រុស {toKhmerNum(hh.members.filter((m) => m.gender === 'male').length)}, ស្រី{' '}
                          {toKhmerNum(hh.members.filter((m) => m.gender === 'female').length)})
                        </span>
                      </td>

                      {/* Poverty Level Badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${pov.badgeClass}`}>
                          {pov.km}
                        </span>
                      </td>

                      {/* WASH & Energy */}
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          {hh.wash.hasLatrine ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">✓ បង្គន់</span>
                          ) : (
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">✗ គ្មានបង្គន់</span>
                          )}
                          <span className="text-slate-300">|</span>
                          <span>{hh.energyAssets.electricitySource === 'national_grid' ? 'ភ្លើងរដ្ឋ' : 'សូឡា/អាគុយ'}</span>
                        </div>
                      </td>

                      {/* Sync Status */}
                      <td className="px-4 py-3">
                        {hh.syncStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock size={11} />
                            <span>រង់ចាំ Sync</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle size={11} />
                            <span>ពពក</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onNavigateToMap && (
                            <button
                              onClick={() => onNavigateToMap(hh)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                hh.location.latitude && hh.location.longitude
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={hh.location.latitude && hh.location.longitude ? "មើលទីតាំងលើផែនទី (View on Map)" : "កំណត់ទីតាំង GPS (Set GPS)"}
                            >
                              <MapPin size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectHousehold(hh)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="មើលសៀវភៅគ្រួសារ (Family Book)"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => onEditHousehold(hh)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="កែប្រែទិន្នន័យ (Edit Survey)"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យគ្រួសាររបស់ ${hh.headName} (${hh.householdCode}) ឬ?`)) {
                                onDeleteHousehold(hh.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="លុប"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHouseholds.map((hh) => {
            const pov = POVERTY_LABELS[hh.povertyLevel];
            const genderInfo = GENDER_LABELS[hh.headGender];

            return (
              <div
                key={hh.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {toKhmerNum(hh.householdCode)}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-khmer-title mt-1.5">
                        {hh.headName}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${genderInfo.color}`}>
                          {genderInfo.km}
                        </span>
                        <span>{toKhmerNum(hh.headAge)} ឆ្នាំ</span>
                        {hh.headPhone && <span>• {hh.headPhone}</span>}
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${pov.badgeClass}`}>
                      {pov.km}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 my-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ទីតាំង:</span>
                      <span className="font-medium text-slate-800">
                        ក្រុមទី {toKhmerNum(hh.location.groupNumber)} {hh.location.houseNumber ? `(ផ្ទះ ${toKhmerNum(hh.location.houseNumber)})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">សមាជិកគ្រួសារ:</span>
                      <span className="font-bold text-slate-900">{toKhmerNum(hh.members.length)} នាក់</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">អនាម័យ/បង្គន់:</span>
                      <span className={hh.wash.hasLatrine ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'}>
                        {hh.wash.hasLatrine ? 'មានបង្គន់' : 'គ្មានបង្គន់'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ដីស្រែ/ចម្ការ:</span>
                      <span className="font-medium text-slate-800">{toKhmerNum(hh.energyAssets.agriculturalLandHectares || 0)} ហិកតា</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    {hh.syncStatus === 'pending' ? (
                      <span className="text-amber-600 font-medium">● រង់ចាំ Sync</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">● បាន Sync</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onNavigateToMap && (
                      <button
                        onClick={() => onNavigateToMap(hh)}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          hh.location.latitude && hh.location.longitude
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title="មើលលើផែនទី"
                      >
                        <MapPin size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectHousehold(hh)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={13} />
                      <span>សៀវភៅគ្រួសារ</span>
                    </button>
                    <button
                      onClick={() => onEditHousehold(hh)}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យគ្រួសាររបស់ ${hh.headName} ឬ?`)) {
                          onDeleteHousehold(hh.id);
                        }
                      }}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
