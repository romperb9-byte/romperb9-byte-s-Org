import React from 'react';
import { Printer, Download, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { VillageCensusSummary, VillageInfo } from '../types';
import { EDUCATION_LABELS, toKhmerNum } from '../utils/khmerLabels';

interface OfficialReportViewProps {
  village: VillageInfo;
  summary: VillageCensusSummary;
  onBack: () => void;
  onExportCSV: () => void;
}

export const OfficialReportView: React.FC<OfficialReportViewProps> = ({
  village,
  summary,
  onBack,
  onExportCSV,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalIDPoor = summary.povertyStats.idpoor1 + summary.povertyStats.idpoor2;
  const idPoorPercent = summary.totalHouseholds > 0 ? Math.round((totalIDPoor / summary.totalHouseholds) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>ត្រឡប់ទៅផ្ទាំងដើម</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <Download size={15} />
            <span>ទាញយក CSV/Excel</span>
          </button>

          <button
            id="btn-print-official-report"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Printer size={16} />
            <span>បោះពុម្ពរបាយការណ៍ (Print)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document */}
      <div className="bg-white p-6 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-slate-900">
        {/* Royal Kingdom of Cambodia Official Header */}
        <div className="text-center space-y-1">
          <div className="text-base sm:text-lg font-bold font-khmer-title tracking-wider text-slate-900">
            ព្រះរាជាណាចក្រកម្ពុជា
          </div>
          <div className="text-sm sm:text-base font-bold font-khmer-title text-amber-700">
            ជាតិ សាសនា ព្រះមហាក្សត្រ
          </div>
          <div className="w-28 h-0.5 bg-amber-600 mx-auto my-1"></div>
        </div>

        {/* Administration Path */}
        <div className="flex justify-between items-start text-xs sm:text-sm">
          <div className="space-y-0.5">
            <div>ខេត្ត/រាជធានី៖ <strong>{village.provinceName}</strong></div>
            <div>ស្រុក/ខណ្ឌ៖ <strong>{village.districtName}</strong></div>
            <div>ឃុំ/សង្កាត់៖ <strong>{village.communeName}</strong></div>
            <div>ភូមិ៖ <strong>{village.villageNameKhmer}</strong></div>
            <div>លេខកូដភូមិ៖ <strong>{toKhmerNum(village.villageCode)}</strong></div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>ថ្ងៃទី........ ខែ........ ឆ្នាំ ២០២៦</div>
            <div className="font-mono text-[11px] text-slate-400 mt-1">ជំរឿនឆ្នាំ {toKhmerNum(village.surveyYear)}</div>
          </div>
        </div>

        {/* Report Main Title */}
        <div className="text-center space-y-1">
          <h1 className="text-lg sm:text-2xl font-black font-khmer-title text-blue-950">
            របាយការណ៍បូកសរុបលទ្ធផលជំរឿនស្ថិតិប្រជាជន និងស្ថានភាពជីវភាពកម្រិតភូមិ
          </h1>
          <p className="text-xs text-slate-600">
            ទិន្នន័យស្រង់ស្ថិតិប្រចាំឆ្នាំ {toKhmerNum(village.surveyYear)} ក្នុង {village.villageNameKhmer}
          </p>
        </div>

        {/* Section I: Demographic Overview */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold font-khmer-title text-slate-900 border-b-2 border-slate-900 pb-1">
            I. ទិន្នន័យទូទៅប្រជាសាស្ត្រ (Demographic Overview)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-xs">ចំនួនគ្រួសារសរុប៖</span>
              <strong className="text-base text-slate-900 font-bold">{toKhmerNum(summary.totalHouseholds)} គ្រួសារ</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                មេគ្រួសារស្រី៖ <strong>{toKhmerNum(summary.femaleHeadedHouseholds)}</strong>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-xs">ប្រជាជនសរុប៖</span>
              <strong className="text-base text-slate-900 font-bold">{toKhmerNum(summary.totalPopulation)} នាក់</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                ស្រី៖ <strong className="text-rose-700">{toKhmerNum(summary.totalFemales)}</strong> • ប្រុស៖ <strong className="text-blue-700">{toKhmerNum(summary.totalMales)}</strong>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-xs">កុមារ & យុវជន៖</span>
              <strong className="text-base text-slate-900 font-bold">{toKhmerNum(summary.childrenUnder18)} នាក់</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                ក្រោម ៥ឆ្នាំ៖ <strong>{toKhmerNum(summary.childrenUnder5)} នាក់</strong>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-xs">មនុស្សចាស់ (៦០+ ឆ្នាំ)៖</span>
              <strong className="text-base text-slate-900 font-bold">{toKhmerNum(summary.elderly60Plus)} នាក់</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                វ័យធ្វើការ (១៨-៥៩)៖ <strong>{toKhmerNum(summary.workingAge)} នាក់</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Group Breakdown Table */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold font-khmer-title text-slate-900 border-b-2 border-slate-900 pb-1">
            II. ស្ថិតិប្រជាជន និងគ្រួសារតាមក្រុមនីមួយៗក្នុងភូមិ
          </h2>

          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="px-3 py-2 text-center w-12">ល.រ</th>
                  <th className="px-3 py-2">ក្រុមទី</th>
                  <th className="px-3 py-2 text-center">ចំនួនគ្រួសារ</th>
                  <th className="px-3 py-2 text-center">ប្រជាជនសរុប</th>
                  <th className="px-3 py-2 text-center text-blue-800">ប្រុស</th>
                  <th className="px-3 py-2 text-center text-rose-800">ស្រី</th>
                  <th className="px-3 py-2 text-center">ភាគរយ %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summary.groupsBreakdown.map((g, idx) => (
                  <tr key={g.groupNumber}>
                    <td className="px-3 py-2 text-center font-bold text-slate-500">{toKhmerNum(idx + 1)}</td>
                    <td className="px-3 py-2 font-bold">ក្រុមទី {toKhmerNum(g.groupNumber)}</td>
                    <td className="px-3 py-2 text-center">{toKhmerNum(g.householdCount)}</td>
                    <td className="px-3 py-2 text-center font-bold">{toKhmerNum(g.populationCount)}</td>
                    <td className="px-3 py-2 text-center text-blue-700">{toKhmerNum(g.males)}</td>
                    <td className="px-3 py-2 text-center text-rose-700">{toKhmerNum(g.females)}</td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {summary.totalPopulation > 0 ? `${toKhmerNum(Math.round((g.populationCount / summary.totalPopulation) * 100))}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-center">សរុបរួម</td>
                  <td className="px-3 py-2 text-center">{toKhmerNum(summary.totalHouseholds)}</td>
                  <td className="px-3 py-2 text-center">{toKhmerNum(summary.totalPopulation)}</td>
                  <td className="px-3 py-2 text-center text-blue-800">{toKhmerNum(summary.totalMales)}</td>
                  <td className="px-3 py-2 text-center text-rose-800">{toKhmerNum(summary.totalFemales)}</td>
                  <td className="px-3 py-2 text-center">១០០%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Section III: Socio-Economic, WASH, and Poverty */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold font-khmer-title text-slate-900 border-b-2 border-slate-900 pb-1">
            III. ស្ថានភាពសេដ្ឋកិច្ច អនាម័យ និងជីវភាពគ្រួសារ (Socio-Economic & WASH)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Poverty & Protection */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900">១. ស្ថានភាពក្រីក្រ (IDPoor)</div>
              <div className="flex justify-between">
                <span>• គ្រួសារក្រីក្រកម្រិត ១ (ក្រ១)៖</span>
                <strong className="text-red-700">{toKhmerNum(summary.povertyStats.idpoor1)} គ្រួសារ</strong>
              </div>
              <div className="flex justify-between">
                <span>• គ្រួសារក្រីក្រកម្រិត ២ (ក្រ២)៖</span>
                <strong className="text-amber-700">{toKhmerNum(summary.povertyStats.idpoor2)} គ្រួសារ</strong>
              </div>
              <div className="flex justify-between">
                <span>• គ្រួសារងាយរងគ្រោះ៖</span>
                <strong>{toKhmerNum(summary.povertyStats.vulnerable)} គ្រួសារ</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span>សរុបអត្រាក្រីក្រ (ក្រ១ + ក្រ២)៖</span>
                <span className="text-red-800">{toKhmerNum(totalIDPoor)} គ្រួសារ ({toKhmerNum(idPoorPercent)}%)</span>
              </div>
            </div>

            {/* WASH & Electricity */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900">២. អនាម័យ ទឹកស្អាត និងថាមពល</div>
              <div className="flex justify-between">
                <span>• គ្រួសារមានបង្គន់អនាម័យ៖</span>
                <strong className="text-emerald-800">{toKhmerNum(summary.washStats.hasLatrineCount)} គ្រួសារ ({toKhmerNum(summary.washStats.hasLatrinePercent)}%)</strong>
              </div>
              <div className="flex justify-between">
                <span>• គ្រួសារប្រើប្រាស់ទឹកស្អាត/ម៉ាស៊ីន៖</span>
                <strong>{toKhmerNum(summary.washStats.cleanWaterCount)} គ្រួសារ ({toKhmerNum(summary.washStats.cleanWaterPercent)}%)</strong>
              </div>
              <div className="flex justify-between">
                <span>• ប្រើប្រាស់អគ្គិសនីរដ្ឋ (EDC)៖</span>
                <strong>{toKhmerNum(summary.energyStats.nationalGridCount)} គ្រួសារ</strong>
              </div>
              <div className="flex justify-between">
                <span>• ប្រើប្រាស់ថាមពលសូឡា/អាគុយ៖</span>
                <strong>{toKhmerNum(summary.energyStats.solarCount + summary.energyStats.batteryCount)} គ្រួសារ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section IV: Agriculture Assets */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold font-khmer-title text-slate-900 border-b-2 border-slate-900 pb-1">
            IV. សក្តានុពលកសិកម្ម និងទ្រព្យសម្បត្តិ (Agriculture & Assets)
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-xs">ផ្ទៃដីស្រែចម្ការសរុប</div>
              <div className="text-base font-bold text-slate-900 mt-1">{toKhmerNum(summary.agricultureStats.totalFarmLandHectares)} ហិកតា</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-xs">សត្វពាហនៈ (គោ/ក្របី)</div>
              <div className="text-base font-bold text-slate-900 mt-1">{toKhmerNum(summary.agricultureStats.totalCattle)} ក្បាល</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-xs">គ្រឿងយន្តកសិកម្ម (គោយន្ត)</div>
              <div className="text-base font-bold text-slate-900 mt-1">{toKhmerNum(summary.agricultureStats.totalKoyon)} គ្រឿង</div>
            </div>
          </div>
        </div>

        {/* Official Signature Block */}
        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs sm:text-sm">
          <div className="space-y-1">
            <div className="font-bold text-slate-900">អ្នកស្រង់ស្ថិតិជំរឿន</div>
            <div className="text-slate-500 text-xs">(ហត្ថលេខា និងឈ្មោះ)</div>
            <div className="h-20"></div>
            <div className="font-bold">{village.surveyorName}</div>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-900">បានឃើញ និងឯកភាព មេភូមិ</div>
            <div className="text-slate-500 text-xs">ថ្ងៃទី........ ខែ........ ឆ្នាំ ២០២៦</div>
            <div className="h-20"></div>
            <div className="font-bold">{village.villageChiefName}</div>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-900">បានឃើញ និងបញ្ជាក់ដោយ មេឃុំ</div>
            <div className="text-slate-500 text-xs">ថ្ងៃទី........ ខែ........ ឆ្នាំ ២០២៦</div>
            <div className="h-20"></div>
            <div className="font-bold font-khmer-title">រដ្ឋបាលឃុំ {village.communeName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
