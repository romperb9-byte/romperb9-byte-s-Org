import React from 'react';
import { X, Printer, Download, MapPin, Users, Home, Droplets, Zap, ShieldAlert, Award } from 'lucide-react';
import { Household, VillageInfo } from '../types';
import { 
  EDUCATION_LABELS, 
  ELECTRICITY_LABELS, 
  GENDER_LABELS, 
  LATRINE_LABELS, 
  MARITAL_LABELS, 
  POVERTY_LABELS, 
  RELATIONSHIP_LABELS, 
  ROOF_LABELS, 
  WALL_LABELS, 
  WATER_LABELS, 
  toKhmerNum 
} from '../utils/khmerLabels';

interface FamilyBookModalProps {
  village: VillageInfo;
  household: Household | null;
  onClose: () => void;
}

export const FamilyBookModal: React.FC<FamilyBookModalProps> = ({
  village,
  household,
  onClose,
}) => {
  if (!household) return null;

  const handlePrint = () => {
    window.print();
  };

  const pov = POVERTY_LABELS[household.povertyLevel];
  const headGender = GENDER_LABELS[household.headGender];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-khmer-title">
              សៀវភៅគ្រួសារអេឡិចត្រូនិក • កូដ: {toKhmerNum(household.householdCode)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer size={14} />
              <span>បោះពុម្ព (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Family Record Document */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-900 bg-white">
          {/* Royal Emblem & Official Header */}
          <div className="text-center space-y-1">
            <div className="text-sm font-bold font-khmer-title tracking-wider text-slate-900">
              ព្រះរាជាណាចក្រកម្ពុជា
            </div>
            <div className="text-xs font-bold font-khmer-title text-amber-700">
              ជាតិ សាសនា ព្រះមហាក្សត្រ
            </div>
            <div className="w-24 h-0.5 bg-amber-600 mx-auto my-1"></div>
            <div className="text-lg sm:text-xl font-black font-khmer-title text-blue-950 mt-2">
              សៀវភៅបញ្ជីគ្រួសារ និងស្ថិតិជំរឿនប្រជាជន
            </div>
            <div className="text-xs font-mono font-bold text-slate-600">
              លេខកូដគ្រួសារ៖ {toKhmerNum(household.householdCode)}
            </div>
          </div>

          {/* Administrative Hierarchy Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">ខេត្ត/រាជធានី: </span>
              <strong className="text-slate-900">{village.provinceName}</strong>
            </div>
            <div>
              <span className="text-slate-500">ស្រុក/ខណ្ឌ: </span>
              <strong className="text-slate-900">{village.districtName}</strong>
            </div>
            <div>
              <span className="text-slate-500">ឃុំ/សង្កាត់: </span>
              <strong className="text-slate-900">{village.communeName}</strong>
            </div>
            <div>
              <span className="text-slate-500">ភូមិ: </span>
              <strong className="text-slate-900">{village.villageNameKhmer}</strong>
            </div>
          </div>

          {/* Household Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">ឈ្មោះមេគ្រួសារ: </span>
                <strong className="text-slate-900 font-khmer-title text-sm">{household.headName}</strong>
              </div>
              <div>
                <span className="text-slate-500">ភេទ: </span>
                <strong>{headGender.km}</strong> • <span className="text-slate-500">អាយុ: </span>
                <strong>{toKhmerNum(household.headAge)} ឆ្នាំ</strong>
              </div>
              <div>
                <span className="text-slate-500">ទូរស័ព្ទ: </span>
                <strong>{household.headPhone || 'គ្មាន'}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-slate-500">ក្រុមទី: </span>
                <strong>{toKhmerNum(household.location.groupNumber)}</strong>
                {household.location.houseNumber && (
                  <span> (ផ្ទះលេខ {toKhmerNum(household.location.houseNumber)})</span>
                )}
              </div>
              <div>
                <span className="text-slate-500">ទីតាំង: </span>
                <span>{household.location.streetOrLocationName || 'ក្នុងភូមិ'}</span>
              </div>
              <div>
                <span className="text-slate-500">ចំនួនសមាជិក: </span>
                <strong className="text-blue-900 font-bold">{toKhmerNum(household.members.length)} នាក់</strong>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <div>
                <span className="text-slate-500">កម្រិតជីវភាព: </span>
                <span className={`inline-block px-2 py-0.5 rounded font-bold ${pov.badgeClass}`}>
                  {pov.km}
                </span>
              </div>
              <div>
                <span className="text-slate-500">កាលបរិច្ឆេទស្រង់: </span>
                <strong>{household.surveyDate}</strong>
              </div>
              <div>
                <span className="text-slate-500">អ្នកស្រង់ស្ថិតិ: </span>
                <strong>{household.surveyorName}</strong>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div>
            <h4 className="text-xs font-bold font-khmer-title uppercase text-slate-800 mb-2">
              បញ្ជីរាយនាមសមាជិកទាំងអស់ក្នុងគ្រួសារ ({toKhmerNum(household.members.length)} នាក់)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-8">ល.រ</th>
                    <th className="px-3 py-2.5">គោត្តនាម-នាម</th>
                    <th className="px-3 py-2.5">ភេទ</th>
                    <th className="px-3 py-2.5">ត្រូវជា</th>
                    <th className="px-3 py-2.5">អាយុ</th>
                    <th className="px-3 py-2.5">អត្តសញ្ញាណប័ណ្ណ</th>
                    <th className="px-3 py-2.5">មុខរបរ</th>
                    <th className="px-3 py-2.5">កម្រិតសិក្សា</th>
                    <th className="px-3 py-2.5">ការគាំពារ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {household.members.map((m, idx) => {
                    const g = GENDER_LABELS[m.gender];
                    const rel = RELATIONSHIP_LABELS[m.relationship];
                    const edu = EDUCATION_LABELS[m.educationLevel];

                    return (
                      <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-3 py-2 text-center font-bold text-slate-500">
                          {toKhmerNum(idx + 1)}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {m.fullNameKhmer}
                          {m.fullNameLatin && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {m.fullNameLatin}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">{g.km}</td>
                        <td className="px-3 py-2 font-medium">{rel.km}</td>
                        <td className="px-3 py-2">{toKhmerNum(m.age)} ឆ្នាំ</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{m.nationalId || '-'}</td>
                        <td className="px-3 py-2">{m.primaryOccupation || '-'}</td>
                        <td className="px-3 py-2">{edu?.km || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {m.hasNSSF && <span className="bg-blue-100 text-blue-800 px-1 rounded">ប.ស.ស</span>}
                            {m.hasIDPoorCard && <span className="bg-amber-100 text-amber-800 px-1 rounded">សមធម៌</span>}
                            {m.hasDisability && <span className="bg-purple-100 text-purple-800 px-1 rounded">ពិការ</span>}
                            {!m.hasNSSF && !m.hasIDPoorCard && !m.hasDisability && <span className="text-slate-400">-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Living Conditions & Assets Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Housing & WASH */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-slate-50/30">
              <div className="font-bold text-slate-900 font-khmer-title mb-1">
                ស្ថានភាពលំនៅដ្ឋាន និងអនាម័យ
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ជញ្ជាំង / ដំបូល:</span>
                <strong>{WALL_LABELS[household.housing.wallType] || household.housing.wallType} / {ROOF_LABELS[household.housing.roofType] || household.housing.roofType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ប្រភពទឹក (ប្រាំង):</span>
                <strong>{WATER_LABELS[household.wash.waterSourceDry] || household.wash.waterSourceDry}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">បង្គន់អនាម័យ:</span>
                <strong className={household.wash.hasLatrine ? 'text-emerald-700' : 'text-rose-600'}>
                  {household.wash.hasLatrine ? `មាន (${LATRINE_LABELS[household.wash.latrineType || 'pour_flush']})` : 'គ្មាន'}
                </strong>
              </div>
            </div>

            {/* Assets & Agriculture */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5 bg-slate-50/30">
              <div className="font-bold text-slate-900 font-khmer-title mb-1">
                ថាមពល និងកសិកម្ម
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ប្រភពអគ្គិសនី:</span>
                <strong>{ELECTRICITY_LABELS[household.energyAssets.electricitySource] || household.energyAssets.electricitySource}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ដីស្រែ/ចម្ការ:</span>
                <strong>{toKhmerNum(household.energyAssets.agriculturalLandHectares || 0)} ហិកតា</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">មធ្យោបាយធ្វើដំណើរ:</span>
                <span>
                  ម៉ូតូ {toKhmerNum(household.energyAssets.hasMotorbike)} • កង់ {toKhmerNum(household.energyAssets.hasBicycle)} • គោយន្ត {toKhmerNum(household.energyAssets.hasKoyonTiller)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures block for printing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-center text-xs">
            <div>
              <div className="font-bold text-slate-800">មេគ្រួសារ</div>
              <div className="text-[11px] text-slate-500">(ស្នាមមេដៃ ឬហត្ថលេខា)</div>
              <div className="h-16"></div>
              <div className="font-bold">{household.headName}</div>
            </div>

            <div>
              <div className="font-bold text-slate-800">អ្នកស្រង់ស្ថិតិ</div>
              <div className="text-[11px] text-slate-500">(ហត្ថលេខា)</div>
              <div className="h-16"></div>
              <div className="font-bold">{household.surveyorName}</div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="font-bold text-slate-800">បានឃើញ និងបញ្ជាក់ដោយមេភូមិ</div>
              <div className="text-[11px] text-slate-500">ថ្ងៃទី........ ខែ........ ឆ្នាំ ២០២៦</div>
              <div className="h-16"></div>
              <div className="font-bold">{village.villageChiefName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
