import React, { useState } from 'react';
import { MENU_DEFINITIONS, INITIAL_HARI_H_GROUPS } from '../data/consumptionData';
import { 
  Utensils, 
  Clock, 
  Store, 
  Tag, 
  DollarSign, 
  Coffee, 
  Users, 
  Search,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const MenuCatalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'makan' | 'snack' | 'minum'>('all');
  const [search, setSearch] = useState('');

  const filteredMenus = MENU_DEFINITIONS.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) {
      return false;
    }
    return (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.vendor.toLowerCase().includes(search.toLowerCase()) ||
      m.timeLabel.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" id="menu-catalog-section">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wide">
              Katalog Menu &amp; Rekanan Vendor
            </span>
            <span className="text-slate-400 text-xs">Standarisasi Konsumsi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            Menu Makanan, Snack, &amp; Minuman HBD
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Rincian vendor penyedia, harga satuan (unit price), jadwal jam pengiriman ke venue, dan alokasi kelompok penerima di Hari H.
          </p>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs flex items-center space-x-4">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Total Menu Terdaftar</div>
            <div className="text-xl font-bold text-white">{MENU_DEFINITIONS.length} Menu</div>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Rentang Harga</div>
            <div className="text-xs font-bold text-emerald-400">Rp 2.500 - Rp 34.000</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu, vendor, atau jadwal waktu..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-700 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedCategory('makan')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedCategory === 'makan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Makanan Utama
          </button>
          <button
            onClick={() => setSelectedCategory('snack')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedCategory === 'snack' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Snack
          </button>
          <button
            onClick={() => setSelectedCategory('minum')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedCategory === 'minum' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minuman
          </button>
        </div>
      </div>

      {/* Grid Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    menu.category === 'makan' ? 'bg-red-50 text-red-700 border border-red-200' :
                    menu.category === 'snack' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {menu.category === 'makan' ? 'Makanan Berat' : menu.category === 'snack' ? 'Snack Box' : 'Minuman'}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1.5">
                    {menu.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900">
                    Rp {menu.price.toLocaleString('id-ID')}
                  </span>
                  <div className="text-[10px] text-slate-400">/ porsi</div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Vendor: <strong className="text-slate-800">{menu.vendor}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Waktu Distribusi: <strong className="text-slate-800">{menu.timeLabel}</strong></span>
                </div>
              </div>

              {menu.description && (
                <p className="text-xs text-slate-500 mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {menu.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Sesi: <strong>{menu.timeSlot.replace('_', ' ').toUpperCase()}</strong></span>
              <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle className="w-3 h-3" />
                <span>Terverifikasi Budget</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
