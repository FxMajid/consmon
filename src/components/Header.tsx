import React from 'react';
import { 
  Utensils, 
  Ticket, 
  Users, 
  BookOpen, 
  PieChart, 
  RotateCcw,
  CheckCircle2, 
  Clock, 
  Download,
  Scan
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'hari_h' | 'voucher' | 'kartu_akses' | 'menu' | 'budget';
  setActiveTab: (tab: 'hari_h' | 'voucher' | 'kartu_akses' | 'menu' | 'budget') => void;
  stats: {
    totalPorsiHariH: number;
    diambilHariH: number;
    sisaHariH: number;
    totalVoucher: number;
    claimedVoucher: number;
  };
  onResetData: () => void;
  onExportCsv: () => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onResetData,
  onExportCsv,
  onOpenScanner
}) => {
  const percentHariH = stats.totalPorsiHariH > 0 
    ? Math.round((stats.diambilHariH / stats.totalPorsiHariH) * 100) 
    : 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Monitoring Konsumsi HBD
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  Live Event
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistem Distribusi Menu Hari H &amp; Manajemen Voucher H-2 / H-1
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Hari H:</span>
              <span className="font-bold text-slate-800">{stats.diambilHariH}/{stats.totalPorsiHariH}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-700 font-semibold">{percentHariH}%</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
              <Ticket className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-amber-800 font-medium">Voucher:</span>
              <span className="font-bold text-amber-900">{stats.claimedVoucher}/{stats.totalVoucher}</span>
            </div>

            {/* Quick Barcode Scanner Trigger */}
            <button
              id="btn-header-scanner"
              onClick={onOpenScanner}
              title="Buka Scanner Barcode / QR Pengambilan"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all animate-pulse hover:animate-none"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>

            <div className="flex items-center space-x-1 ml-auto">
              <button
                id="btn-export-csv"
                onClick={onExportCsv}
                title="Export data ke CSV"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                id="btn-reset-data"
                onClick={onResetData}
                title="Reset status pengambilan ke default"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 border-t border-slate-100 overflow-x-auto py-1 scrollbar-none" id="main-navigation-tabs">
          <button
            id="tab-hari-h"
            onClick={() => setActiveTab('hari_h')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'hari_h'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hari H (Distribusi Menu)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'hari_h' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
              Jadwal
            </span>
          </button>

          <button
            id="tab-voucher"
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'voucher'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Voucher H-2 &amp; H-1</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'voucher' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
              Voucher
            </span>
          </button>

          <button
            id="tab-kartu-akses"
            onClick={() => setActiveTab('kartu_akses')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'kartu_akses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ID Card &amp; Aktivasi QR</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'kartu_akses' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              QR Fisik &amp; Digital
            </span>
          </button>

          <button
            id="tab-menu"
            onClick={() => setActiveTab('menu')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'menu'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Katalog Menu &amp; Vendor</span>
          </button>

          <button
            id="tab-budget"
            onClick={() => setActiveTab('budget')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'budget'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Rekap Biaya &amp; Budget</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
