import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Cloud, 
  CloudOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Code2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseConfigStatus, getSupabase } from '../lib/supabase';
import { bulkUpsertIdCardsToSupabase } from '../lib/supabaseService';
import { IDCardKonsumsi } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  idCards: IDCardKonsumsi[];
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  idCards,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const status = getSupabaseConfigStatus();

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
    voucher_code TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.id_cards_konsumsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hari_h_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all id_cards" ON public.id_cards_konsumsi FOR ALL USING (true);
CREATE POLICY "Allow public all hari_h" ON public.hari_h_distributions FOR ALL USING (true);
CREATE POLICY "Allow public all vouchers" ON public.vouchers FOR ALL USING (true);

-- 5. Enable Realtime Publications
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
      const ok = await bulkUpsertIdCardsToSupabase(idCards);
      if (ok) {
        setSyncFeedback('Sukses! Data ID Card berhasil diunggah ke Supabase.');
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
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {status.isConfigured
                    ? 'Koneksi Supabase Aktif'
                    : 'Koneksi Supabase Belum Dikonfigurasi'}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {status.isConfigured
                    ? 'Aplikasi terhubung langsung ke project Supabase. Data ID Card dan distribusi konsumsi akan disinkronkan ke PostgreSQL Cloud.'
                    : 'Aplikasi saat ini berjalan menggunakan penyimpanan lokal (localStorage). Data tetap tersimpan di browser Anda dengan aman.'}
                </p>
                {status.url && (
                  <div className="pt-1 font-mono text-[11px] text-slate-600">
                    URL: <strong className="text-slate-900">{status.url}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Setup Guide Steps */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Langkah Menghubungkan ke Supabase:</span>
            </h4>

            <ol className="space-y-2.5 text-slate-700 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900">Buat Project di Supabase</span> (buka{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-semibold inline-flex items-center space-x-0.5"
                >
                  <span>supabase.com</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
                ).
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900">Jalankan Schema SQL</span> di{' '}
                <strong>SQL Editor</strong> Supabase untuk membuat tabel <code>id_cards_konsumsi</code>,{' '}
                <code>hari_h_distributions</code>, dan <code>vouchers</code>.
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900">Salin API Credentials</span> dari menu{' '}
                <strong>Project Settings &rarr; API</strong>:
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 mt-1 font-mono text-[11px] text-slate-800 space-y-1">
                  <div>VITE_SUPABASE_URL = &quot;https://xxxx.supabase.co&quot;</div>
                  <div>VITE_SUPABASE_ANON_KEY = &quot;eyJh......&quot;</div>
                </div>
              </li>
              <li className="leading-relaxed">
                Masukkan nilai di atas ke dalam menu <strong>Settings</strong> AI Studio atau file{' '}
                <code>.env</code>.
              </li>
            </ol>
          </div>

          {/* SQL Schema Copy Box */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-mono text-emerald-400">
                <Code2 className="w-3.5 h-3.5" />
                <span className="font-bold">supabaseSchema.sql</span>
              </div>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL Schema</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950 p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed">
              <pre className="whitespace-pre-wrap">
{`-- 1. Tabel ID Card Konsumsi & Aktivasi Mandiri
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
    claimed_meals JSONB DEFAULT '{"pagi": {"claimed": false}, "siang": {"claimed": false}, "malam": {"claimed": false}}'::jsonb
);

-- 2. Tabel Distribusi Grup Hari H & Vouchers
CREATE TABLE IF NOT EXISTS public.hari_h_distributions ( ... );
CREATE TABLE IF NOT EXISTS public.vouchers ( ... );`}
              </pre>
            </div>
          </div>

          {/* Initial Push Action (if configured) */}
          {status.isConfigured && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-emerald-950">Sinkronisasi Awal Data ID Card</div>
                <p className="text-[11px] text-emerald-800">
                  Unggah {idCards.length} kartu lokal saat ini ke tabel Supabase.
                </p>
                {syncFeedback && (
                  <div className="text-[11px] font-bold text-emerald-700 mt-1">{syncFeedback}</div>
                )}
              </div>
              <button
                onClick={handleInitialSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Mengunggah...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            File konfigurasi: <code>src/lib/supabase.ts</code> &amp; <code>.env.example</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
