import React, { useState } from 'react';
import { 
  Users, 
  Home, 
  ShieldAlert, 
  Droplets, 
  Zap, 
  Baby, 
  HeartHandshake, 
  Tractor, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Award,
  FileSpreadsheet,
  Plus,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Household, VillageCensusSummary, VillageInfo } from '../types';
import { EDUCATION_LABELS, toKhmerNum } from '../utils/khmerLabels';
import { syncService } from '../services/sync';

interface DashboardViewProps {
  village: VillageInfo;
  households: Household[];
  summary: VillageCensusSummary;
  onNavigateToSurveys: () => void;
  onNavigateToNewSurvey: () => void;
  onNavigateToReport: () => void;
  onNavigateToMap?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  village,
  households,
  summary,
  onNavigateToSurveys,
  onNavigateToNewSurvey,
  onNavigateToReport,
  onNavigateToMap,
}) => {
  const [aiReport, setAiReport] = useState<{ summaryHtml: string; recommendations: string[] } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleGenerateAiInsight = async () => {
    setIsLoadingAi(true);
    try {
      const result = await syncService.generateAiReport(village, households);
      setAiReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Chart Data: Poverty Breakdown
  const povertyData = [
    { name: 'ក្រ១ (ក្រីក្រខ្លាំង)', value: summary.povertyStats.idpoor1, color: '#ef4444' },
    { name: 'ក្រ២ (ក្រីក្រមធ្យម)', value: summary.povertyStats.idpoor2, color: '#f59e0b' },
    { name: 'ងាយរងគ្រោះ', value: summary.povertyStats.vulnerable, color: '#8b5cf6' },
    { name: 'ជីវភាពធម្មតា', value: summary.povertyStats.nonPoor, color: '#10b981' },
  ].filter((d) => d.value > 0);

  // Chart Data: Gender & Age Brackets
  const ageData = [
    { name: 'កុមារ (<៥ឆ្នាំ)', count: summary.childrenUnder5 },
    { name: 'កុមារ (៥-១៧ឆ្នាំ)', count: Math.max(0, summary.childrenUnder18 - summary.childrenUnder5) },
    { name: 'វ័យធ្វើការ (១៨-៥៩)', count: summary.workingAge },
    { name: 'មនុស្សចាស់ (៦០+)', count: summary.elderly60Plus },
  ];

  // Chart Data: Group Breakdown
  const groupData = summary.groupsBreakdown.map((g) => ({
    name: `ក្រុម ${g.groupNumber}`,
    'គ្រួសារ': g.householdCount,
    'ប្រុស': g.males,
    'ស្រី': g.females,
  }));

  // Chart Data: Education
  const educationData = Object.entries(summary.educationStats).map(([key, val]) => ({
    name: EDUCATION_LABELS[key as keyof typeof EDUCATION_LABELS]?.km || key,
    count: val,
  }));

  const totalIDPoor = summary.povertyStats.idpoor1 + summary.povertyStats.idpoor2;
  const idPoorPercent = summary.totalHouseholds > 0 ? Math.round((totalIDPoor / summary.totalHouseholds) * 100) : 0;
  const mappedCount = households.filter((h) => h.location.latitude && h.location.longitude).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
            <Award size={14} className="text-blue-600" />
            <span>ជំរឿនស្ថិតិប្រចាំឆ្នាំ {toKhmerNum(village.surveyYear)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-khmer-title">
            ទិដ្ឋភាពទូទៅនៃស្ថិតិ {village.villageNameKhmer}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ទិន្នន័យស្រង់ស្ថិតិ និងផ្ទៀងផ្ទាត់ដោយ {village.surveyorName} • ប្រធានភូមិ {village.villageChiefName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToMap && (
            <button
              id="btn-view-map-hero"
              onClick={onNavigateToMap}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all border border-blue-200 shadow-xs"
            >
              <MapPin size={16} className="text-rose-600" />
              <span>ផែនទីភូមិ ({toKhmerNum(mappedCount)} ទីតាំង)</span>
            </button>
          )}
          <button
            id="btn-add-survey-hero"
            onClick={onNavigateToNewSurvey}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-xs"
          >
            <Plus size={16} />
            <span>ចុះឈ្មោះគ្រួសារថ្មី</span>
          </button>
          <button
            id="btn-view-report-hero"
            onClick={onNavigateToReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200 transition-all border border-slate-200"
          >
            <FileSpreadsheet size={16} />
            <span>របាយការណ៍ផ្លូវការ</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Population */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">ប្រជាជនសរុប</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {toKhmerNum(summary.totalPopulation)}
            </span>
            <span className="text-xs text-slate-500">នាក់</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>ប្រុស: <strong className="text-blue-700">{toKhmerNum(summary.totalMales)}</strong></span>
            <span>ស្រី: <strong className="text-rose-700">{toKhmerNum(summary.totalFemales)}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Households */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">គ្រួសារសរុប</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Home size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {toKhmerNum(summary.totalHouseholds)}
            </span>
            <span className="text-xs text-slate-500">គ្រួសារ</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>មេគ្រួសារស្រី:</span>
            <strong className="text-indigo-800">{toKhmerNum(summary.femaleHeadedHouseholds)} គ្រួសារ</strong>
          </div>
        </div>

        {/* Card 3: Poverty Level */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">គ្រួសារក្រីក្រ (IDPoor)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {toKhmerNum(totalIDPoor)}
            </span>
            <span className="text-xs text-slate-500">({toKhmerNum(idPoorPercent)}%)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>ក្រ១: <strong className="text-red-600">{toKhmerNum(summary.povertyStats.idpoor1)}</strong></span>
            <span>ក្រ២: <strong className="text-amber-600">{toKhmerNum(summary.povertyStats.idpoor2)}</strong></span>
          </div>
        </div>

        {/* Card 4: WASH & Environment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">អនាម័យ & ទឹកស្អាត</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Droplets size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-700">
              {toKhmerNum(summary.washStats.hasLatrinePercent)}%
            </span>
            <span className="text-xs text-slate-500">មានបង្គន់</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>ទឹកស្អាត/ម៉ាស៊ីន:</span>
            <strong className="text-teal-800">{toKhmerNum(summary.washStats.cleanWaterPercent)}%</strong>
          </div>
        </div>
      </div>

      {/* AI Village Demographic Insights Generator */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 rounded-2xl p-5 sm:p-6 border border-indigo-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-khmer-title">
                ការវិភាគស្ថិតិ & ផែនការអភិវឌ្ឍន៍ភូមិ (AI Insights)
              </h2>
              <p className="text-xs text-slate-500">
                វិភាគទិន្នន័យស្វ័យប្រវត្តិចូលទៅក្នុងសេចក្តីសង្ខេប និងអនុសាសន៍គោលនយោបាយ
              </p>
            </div>
          </div>

          <button
            id="btn-generate-ai-insight"
            onClick={handleGenerateAiInsight}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
          >
            <Sparkles size={14} className={isLoadingAi ? 'animate-spin' : ''} />
            <span>{isLoadingAi ? 'កំពុងវិភាគ...' : aiReport ? 'វិភាគស្ថិតិឡើងវិញ' : 'ទាញយកការវិភាគសង្ខេប'}</span>
          </button>
        </div>

        {aiReport ? (
          <div className="space-y-4 pt-2 border-t border-indigo-100">
            <div 
              className="text-sm text-slate-700 leading-relaxed bg-white/80 p-4 rounded-xl border border-indigo-100"
              dangerouslySetInnerHTML={{ __html: aiReport.summaryHtml }}
            />
            {aiReport.recommendations && aiReport.recommendations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-indigo-600" />
                  <span>អនុសាសន៍សម្រាប់ការអភិវឌ្ឍភូមិ៖</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiReport.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-indigo-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-white/60 p-3.5 rounded-xl border border-indigo-100/60 flex items-center justify-between">
            <span>ចុចប៊ូតុង "ទាញយកការវិភាគសង្ខេប" ដើម្បីបង្កើតសេចក្តីសង្ខេបពិស្តារសម្រាប់ភូមិ។</span>
          </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Poverty Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 font-khmer-title mb-1">
            ចំណាត់ថ្នាក់កម្រិតជីវភាព (Poverty Level)
          </h2>
          <p className="text-xs text-slate-500 mb-4">សមាមាត្រគ្រួសារក្រីក្រ កម្រិត១ កម្រិត២ និងគ្រួសារធម្មតា</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={povertyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {povertyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${toKhmerNum(value)} គ្រួសារ`, 'ចំនួន']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Age Bracket Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 font-khmer-title mb-1">
            ការបែងចែកក្រុមអាយុប្រជាជន (Age Distribution)
          </h2>
          <p className="text-xs text-slate-500 mb-4">ចំនួនប្រជាជនតាមវ័យ កុមារ វ័យធ្វើការ និងមនុស្សចាស់</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`${toKhmerNum(value)} នាក់`, 'ចំនួន']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Group by Group Population */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 font-khmer-title mb-1">
            ស្ថិតិតាមក្រុមនីមួយៗ (Groups Breakdown)
          </h2>
          <p className="text-xs text-slate-500 mb-4">ការប្រៀបធៀបចំនួនប្រជាជនប្រុស-ស្រី តាមក្រុមក្នុងភូមិ</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any, name: any) => [`${toKhmerNum(value)} នាក់`, name]} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="ប្រុស" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ស្រី" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Education Level */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 font-khmer-title mb-1">
            កម្រិតវប្បធម៌ និងការអប់រំ (Education Level)
          </h2>
          <p className="text-xs text-slate-500 mb-4">ចំនួនប្រជាជនតាមកម្រិតសិក្សាធិការ</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={educationData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(value: any) => [`${toKhmerNum(value)} នាក់`, 'ចំនួន']} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Summary Stats Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-khmer-title">
              ស្ថិតិសង្ខេបតាមក្រុមក្នុងភូមិ
            </h2>
            <p className="text-xs text-slate-500">តារាងទិន្នន័យប្រជាជន និងគ្រួសារតាមក្រុម</p>
          </div>
          <button
            onClick={onNavigateToSurveys}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            មើលបញ្ជីគ្រួសារទាំងអស់ →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ក្រុមទី</th>
                <th className="px-4 py-3">ចំនួនគ្រួសារ</th>
                <th className="px-4 py-3">ប្រជាជនសរុប</th>
                <th className="px-4 py-3 text-blue-700">ប្រុស</th>
                <th className="px-4 py-3 text-rose-700">ស្រី</th>
                <th className="px-4 py-3">សមាមាត្រ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.groupsBreakdown.map((g) => (
                <tr key={g.groupNumber} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900">ក្រុមទី {toKhmerNum(g.groupNumber)}</td>
                  <td className="px-4 py-3">{toKhmerNum(g.householdCount)} គ្រួសារ</td>
                  <td className="px-4 py-3 font-bold">{toKhmerNum(g.populationCount)} នាក់</td>
                  <td className="px-4 py-3 text-blue-700 font-medium">{toKhmerNum(g.males)}</td>
                  <td className="px-4 py-3 text-rose-700 font-medium">{toKhmerNum(g.females)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {summary.totalPopulation > 0 
                      ? `${toKhmerNum(Math.round((g.populationCount / summary.totalPopulation) * 100))}%` 
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td className="px-4 py-3">សរុបទាំងភូមិ</td>
                <td className="px-4 py-3">{toKhmerNum(summary.totalHouseholds)} គ្រួសារ</td>
                <td className="px-4 py-3">{toKhmerNum(summary.totalPopulation)} នាក់</td>
                <td className="px-4 py-3 text-blue-700">{toKhmerNum(summary.totalMales)}</td>
                <td className="px-4 py-3 text-rose-700">{toKhmerNum(summary.totalFemales)}</td>
                <td className="px-4 py-3">១០០%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
