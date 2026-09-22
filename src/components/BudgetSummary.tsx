import React from 'react';
import { BUDGET_SUMMARY } from '../data/consumptionData';
import { 
  PieChart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CheckCircle2, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const BudgetSummary: React.FC = () => {
  const {
    hMinus2,
    hMinus1,
    hariHKonsumsi,
    bufferDanaCash,
    akomodasi,
    totalAllSheet,
    budgetProposal,
    sisaBudget
  } = BUDGET_SUMMARY;

  const pctUsage = Math.round((totalAllSheet / budgetProposal) * 100);
  const pctSavings = 100 - pctUsage;

  const breakdownItems = [
    {
      title: 'Hari H-2 (Voucher)',
      nominal: hMinus2,
      desc: 'Voucher makan siang 35 pax (Panitia MD & OB)',
      pctOfTotal: ((hMinus2 / totalAllSheet) * 100).toFixed(1),
      color: 'bg-amber-500',
    },
    {
      title: 'Hari H-1 (Voucher & Logistik)',
      nominal: hMinus1,
      desc: 'Makan siang (Ladas), malam (Puti Minang), dan logistik minuman',
      pctOfTotal: ((hMinus1 / totalAllSheet) * 100).toFixed(1),
      color: 'bg-orange-500',
    },
    {
      title: 'Hari H (Distribusi Menu Langsung)',
      nominal: hariHKonsumsi,
      desc: 'Sarapan, snack pagi, makan siang, snack sore, minuman, dan makan malam',
      pctOfTotal: ((hariHKonsumsi / totalAllSheet) * 100).toFixed(1),
      color: 'bg-red-600',
    },
    {
      title: 'Buffer Dana Cash',
      nominal: bufferDanaCash,
      desc: 'Dana tak terduga konsumsi on-the-spot',
      pctOfTotal: ((bufferDanaCash / totalAllSheet) * 100).toFixed(1),
      color: 'bg-purple-500',
    },
    {
      title: 'Akomodasi & Operasional',
      nominal: akomodasi,
      desc: 'Transportasi pengantaran & perlengkapan konsumsi',
      pctOfTotal: ((akomodasi / totalAllSheet) * 100).toFixed(1),
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6" id="budget-summary-section">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-semibold uppercase tracking-wide">
              Rekapitulasi Anggaran
            </span>
            <span className="text-emerald-100 text-xs">Proposal vs Realisasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            Ringkasan Keuangan Konsumsi HBD
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
            Total pemakaian anggaran konsumsi seluruh rangkaian acara (H-2, H-1, Hari H, buffer, dan akomodasi) berada dalam batas aman dengan efisiensi sisa budget.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3 sm:px-4 rounded-xl border border-white/20 flex items-center space-x-4">
          <div>
            <div className="text-[11px] text-emerald-200 font-medium">Sisa Efisiensi Budget</div>
            <div className="text-xl sm:text-2xl font-black text-white">
              Rp {sisaBudget.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-emerald-200 mt-0.5">
              Hemat {pctSavings}% dari proposal
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Budget Proposal Awal</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            Rp {budgetProposal.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alokasi pagu dana disetujui
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Realisasi (All Sheet)</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-2">
            Rp {totalAllSheet.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {pctUsage}% dari pagu anggaran
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Status Anggaran</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 mt-2">
            SURPLUS / AMAN
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            Tersisa Rp {sisaBudget.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Progress Bar of Budget Utilization */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Tingkat Penyerapan Anggaran ({pctUsage}%)</span>
          <span className="text-emerald-600 font-bold">Tersisa: Rp {sisaBudget.toLocaleString('id-ID')}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
          <div className="bg-amber-500 h-full" style={{ width: `${(hMinus2 / budgetProposal) * 100}%` }} title="H-2"></div>
          <div className="bg-orange-500 h-full" style={{ width: `${(hMinus1 / budgetProposal) * 100}%` }} title="H-1"></div>
          <div className="bg-red-600 h-full" style={{ width: `${(hariHKonsumsi / budgetProposal) * 100}%` }} title="Hari H"></div>
          <div className="bg-purple-500 h-full" style={{ width: `${(bufferDanaCash / budgetProposal) * 100}%` }} title="Buffer Cash"></div>
          <div className="bg-blue-500 h-full" style={{ width: `${(akomodasi / budgetProposal) * 100}%` }} title="Akomodasi"></div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>H-2: 1.6%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>H-1: 13.3%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Hari H: 62.2%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Buffer Cash: 5.6%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Akomodasi: 1.9%</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
          Rincian Pos Pengeluaran Konsumsi (Sesuai Master Sheet)
        </div>
        <div className="divide-y divide-slate-100">
          {breakdownItems.map((item, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start space-x-3">
                <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${item.color}`}></span>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-black text-slate-900">
                  Rp {item.nominal.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {item.pctOfTotal}% dari total konsumsi
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
