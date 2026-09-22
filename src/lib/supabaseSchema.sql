-- ==============================================================================
-- SUPABASE DATABASE SCHEMA: SISTEM DISTRIBUSI KONSUMSI HBD
-- ==============================================================================
-- Jalankan script SQL ini di Supabase Dashboard -> SQL Editor -> New query -> Run.
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

-- Index untuk pencarian cepat barcode dan status
CREATE INDEX IF NOT EXISTS idx_id_cards_pickup_code ON public.id_cards_konsumsi (pickup_code);
CREATE INDEX IF NOT EXISTS idx_id_cards_activation_code ON public.id_cards_konsumsi (activation_code);
CREATE INDEX IF NOT EXISTS idx_id_cards_status ON public.id_cards_konsumsi (status);
CREATE INDEX IF NOT EXISTS idx_id_cards_area_kerja ON public.id_cards_konsumsi (area_kerja);

-- 2. Tabel Distribusi Grup Hari H (Pagi, Siang, Malam, Snack, Minum)
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
    pagi_notes TEXT,
    snack_pagi_qty INTEGER DEFAULT 0,
    snack_pagi_menu TEXT DEFAULT '',
    snack_pagi_status TEXT DEFAULT 'pending',
    snack_pagi_picked_at TEXT,
    snack_pagi_receiver TEXT,
    siang_qty INTEGER DEFAULT 0,
    siang_menu TEXT DEFAULT '',
    siang_status TEXT DEFAULT 'pending',
    siang_picked_at TEXT,
    siang_receiver TEXT,
    siang_notes TEXT,
    snack_siang_qty INTEGER DEFAULT 0,
    snack_siang_menu TEXT DEFAULT '',
    snack_siang_status TEXT DEFAULT 'pending',
    snack_siang_picked_at TEXT,
    snack_siang_receiver TEXT,
    minuman_qty INTEGER DEFAULT 0,
    minuman_menu TEXT DEFAULT '',
    minuman_status TEXT DEFAULT 'pending',
    minuman_picked_at TEXT,
    minuman_receiver TEXT,
    malam_qty INTEGER DEFAULT 0,
    malam_menu TEXT DEFAULT '',
    malam_status TEXT DEFAULT 'pending',
    malam_picked_at TEXT,
    malam_receiver TEXT,
    malam_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabel Voucher Konsumsi H-2, H-1, Hari H
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
    notes TEXT,
    voucher_code TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) & Public Anon Policies
ALTER TABLE public.id_cards_konsumsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hari_h_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (Public Read & Write untuk operasional pos konsumsi dengan Anon Key)
CREATE POLICY "Allow public read id_cards_konsumsi" ON public.id_cards_konsumsi
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert id_cards_konsumsi" ON public.id_cards_konsumsi
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update id_cards_konsumsi" ON public.id_cards_konsumsi
    FOR UPDATE USING (true);

CREATE POLICY "Allow public all hari_h_distributions" ON public.hari_h_distributions
    FOR ALL USING (true);

CREATE POLICY "Allow public all vouchers" ON public.vouchers
    FOR ALL USING (true);

-- 5. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.id_cards_konsumsi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hari_h_distributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
