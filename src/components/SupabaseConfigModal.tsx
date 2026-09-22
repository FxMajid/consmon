import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  Copy, 
  Check, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  Code2,
  Layers,
  ArrowUpRight,
  KeyRound,
  Globe,
  Trash2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getSupabaseConfigStatus, 
  saveSupabaseConfig, 
  clearSupabaseConfig,
  getSupabaseUrl,
  getSupabaseAnonKey
} from '../lib/supabase';
import { 
  bulkUpsertIdCardsToSupabase, 
  bulkUpsertHariHToSupabase, 
  bulkUpsertVouchersToSupabase 
} from '../lib/supabaseService';
import { IDCardKonsumsi, HariHGroupDistribution, VoucherDistributionItem } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  idCards: IDCardKonsumsi[];
  hariHGroups?: HariHGroupDistribution[];
  vouchers?: VoucherDistributionItem[];
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  idCards,
  hariHGroups = [],
  vouchers = [],
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Form states for in-app configuration
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputUrl(getSupabaseUrl() || '');
      setInputKey(getSupabaseAnonKey() || '');
      setSaveSuccess(false);
      setSyncFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const status = getSupabaseConfigStatus();

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      alert('Mohon isi URL dan Anon Key Supabase!');
      return;
    }

    const success = saveSupabaseConfig(inputUrl, inputKey);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      alert('Format URL tidak valid. Pastikan diawali dengan https://');
    }
  };

  const handleClearCredentials = () => {
    if (window.confirm('Hapus konfigurasi Supabase kustom dan kembali ke mode bawaan?')) {
      clearSupabaseConfig();
      setInputUrl('');
      setInputKey('');
      window.location.reload();
    }
  };

  const handleCopySql = () => {
    const sqlContent = `-- ==============================================================================
-- SUPABASE DATABASE SCHEMA: SISTEM DISTRIBUSI KONSUMSI HBD
-- ==============================================================================

-- 1. Tabel ID Card Konsumsi & Aktivasi Mandiri
CREATE TABLE IF NOT EXISTS public.id_cards_konsumsi (
    id TEXT PRIMARY KEY,
    card_code TEXT NOT NULL,
    activation_code TEXT NOT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unactivated',
    holder_name TEXT,
    holder_email TEXT,
    area_kerja TEXT,
    kategori TEXT DEFAULT 'Internal',
    activated_at TEXT,
    claimed_meals JSONB DEFAULT '{"pagi": {"claimed": false}, "siang": {"claimed": false}, "malam": {"claimed": false}}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_id_cards_pickup_code ON public.id_cards_konsumsi (pickup_code);
CREATE INDEX IF NOT EXISTS idx_id_cards_activation_code ON public.id_cards_konsumsi (activation_code);
CREATE INDEX IF NOT EXISTS idx_id_cards_status ON public.id_cards_konsumsi (status);

-- 2. Tabel Distribusi Grup Hari H
CREATE TABLE IF NOT EXISTS public.hari_h_distributions (
    id TEXT PRIMARY KEY,
    no INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_phone TEXT,
    pagi_qty INTEGER DEFAULT 0,
    pagi_menu TEXT DEFAULT '',
    pagi_status TEXT DEFAULT 'pending',
    pagi_picked_at TEXT,
    pagi_receiver TEXT,
    siang_qty INTEGER DEFAULT 0,
    siang_menu TEXT DEFAULT '',
    siang_status TEXT DEFAULT 'pending',
    siang_picked_at TEXT,
    siang_receiver TEXT,
    malam_qty INTEGER DEFAULT 0,
    malam_menu TEXT DEFAULT '',
    malam_status TEXT DEFAULT 'pending',
    malam_picked_at TEXT,
    malam_receiver TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabel Voucher Konsumsi
CREATE TABLE IF NOT EXISTS public.vouchers (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    group_no INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    pic_phone TEXT,
    qty INTEGER NOT NULL DEFAULT 0,
    menu_vendor TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unclaimed',
    claimed_at TEXT,
    receiver_name TEXT,
    voucher_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) & Akses Publik
ALTER TABLE public.id_cards_konsumsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hari_h_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access id_cards" ON public.id_cards_konsumsi;
CREATE POLICY "Public access id_cards" ON public.id_cards_konsumsi FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access hari_h" ON public.hari_h_distributions;
CREATE POLICY "Public access hari_h" ON public.hari_h_distributions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access vouchers" ON public.vouchers;
CREATE POLICY "Public access vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.id_cards_konsumsi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hari_h_distributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleInitialSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      // 1. Sync ID Cards
      const okCards = await bulkUpsertIdCardsToSupabase(idCards);
      
      // 2. Sync Hari H Groups if provided
      let okHariH = true;
      if (hariHGroups && hariHGroups.length > 0) {
        okHariH = await bulkUpsertHariHToSupabase(hariHGroups);
      }

      // 3. Sync Vouchers if provided
      let okVouchers = true;
      if (vouchers && vouchers.length > 0) {
        okVouchers = await bulkUpsertVouchersToSupabase(vouchers);
      }

      if (okCards || okHariH || okVouchers) {
        setSyncFeedback(`Sukses! ${idCards.length} ID Card, ${hariHGroups.length} grup Hari H, dan ${vouchers.length} voucher berhasil disimpan ke Supabase.`);
      } else {
        setSyncFeedback('Gagal mengunggah data. Pastikan skrip SQL sudah dijalankan di Supabase.');
      }
    } catch (e: any) {
      setSyncFeedback(`Terjadi kesalahan: ${e.message || 'Koneksi gagal'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      id="modal-supabase-config"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm">Konfigurasi Integrasi Supabase</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    status.isConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {status.isConfigured ? 'Terhubung (Cloud)' : 'Mode Lokal (Offline)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                PostgreSQL Cloud Database &amp; Realtime Sync untuk Konsumsi HBD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Box */}
          <div
            className={`rounded-xl border p-4 text-xs ${
              status.isConfigured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start space-x-3">
              {status.isConfigured ? (
                <Cloud className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <CloudOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="font-bold text-sm flex items-center justify-between">
                  <span>
                    {status.isConfigured
                      ? 'Koneksi Supabase Aktif & Terhubung'
                      : 'Koneksi Supabase Belum Terhubung'}
                  </span>
                  {status.isCustomLocal && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Tersimpan di Browser
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {status.isConfigured
                    ? 'Aplikasi terhubung langsung ke project Supabase. Data ID Card dan distribusi konsumsi disinkronkan secara real-time ke PostgreSQL Cloud.'
                    : 'Aplikasi saat ini berjalan menggunakan penyimpanan lokal browser. Masukkan kredensial Supabase di bawah untuk langsung menyambungkan.'}
                </p>
                {status.url && (
                  <div className="pt-1 font-mono text-[11px] text-slate-600 truncate">
                    URL: <strong className="text-slate-900">{status.url}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Input Kredensial Langsung (Bisa untuk Vercel / Browser manapun) */}
          <form onSubmit={handleSaveCredentials} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Input Kredensial Supabase (Langsung Aktif di Browser / Vercel)</span>
              </div>
              {status.isCustomLocal && (
                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="text-red-600 hover:text-red-700 inline-flex items-center space-x-1 text-[11px] font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Project URL (contoh: https://xxxxxx.supabase.co)
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    required
                    placeholder="https://xxxxxx.supabase.co"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Anon Public Key (eyJhbGciOi...)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="eyJh..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">
                Ambil dari Supabase &rarr; <strong>Project Settings &rarr; API</strong>
              </span>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveSuccess ? 'Tersimpan! Memuat...' : 'Simpan & Sambungkan'}</span>
              </button>
            </div>
          </form>

          {/* Vercel Environment Variables Instruction */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-blue-950 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Cara Konfigurasi Permanen di Vercel (Environment Variables)</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              Di Vercel (seperti <code className="font-semibold text-blue-950">consmon.vercel.app</code>), aplikasi dijalankan dari build server Vercel. Agar semua pengunjung otomatis terhubung tanpa perlu mengisi form di atas:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-950 font-medium pl-1">
              <li>Buka dashboard <strong>Vercel &rarr; Project (consmon) &rarr; Settings &rarr; Environment Variables</strong></li>
              <li>Tambahkan variabel: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">VITE_SUPABASE_URL</code> = (URL Supabase Anda)</li>
              <li>Tambahkan variabel: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> = (Anon Key Supabase Anda)</li>
              <li>Buka tab <strong>Deployments</strong> di Vercel, lalu klik menu titik tiga (&bull;&bull;&bull;) &rarr; <strong>Redeploy</strong> agar variabel dimasukkan ke build Vite.</li>
            </ol>
          </div>

          {/* Schema SQL Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Code2 className="w-4 h-4 text-slate-600" />
                <span>Schema SQL Supabase</span>
              </div>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-semibold transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 text-slate-300 font-mono text-[11px] max-h-36 overflow-y-auto border border-slate-800">
              <pre>{`-- 1. Tabel ID Card Konsumsi & Aktivasi Mandiri
CREATE TABLE IF NOT EXISTS public.id_cards_konsumsi (
    id TEXT PRIMARY KEY,
    card_code TEXT NOT NULL,
    activation_code TEXT NOT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unactivated',
    holder_name TEXT,
    holder_email TEXT,
    area_kerja TEXT,
    kategori TEXT DEFAULT 'Internal',
    activated_at TEXT,
    claimed_meals JSONB DEFAULT '{"pagi": {"claimed": false}, "siang": {"claimed": false}, "malam": {"claimed": false}}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);`}</pre>
            </div>
          </div>

          {/* Initial Data Seed Button */}
          {status.isConfigured && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-700" />
                <span>Simpan &amp; Sinkronkan Semua Data Bawaan ke Supabase</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Unggah semua data bawaan ({idCards.length} ID Card panitia, {hariHGroups.length} grup distribusi Hari H, dan {vouchers.length} voucher) langsung ke tabel database Supabase.
              </p>
              <button
                onClick={handleInitialSync}
                disabled={isSyncing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sedang Menyimpan ke Database...' : 'Simpan Semua Data Bawaan ke Supabase'}</span>
              </button>
              {syncFeedback && (
                <div className="text-[11px] font-medium text-emerald-900 pt-1">
                  {syncFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            File konfigurasi: <code className="font-mono text-slate-700">src/lib/supabase.ts &amp; .env.example</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
