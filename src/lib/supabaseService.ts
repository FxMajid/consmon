import { getSupabase, isSupabaseConfigured } from './supabase';
import { IDCardKonsumsi, HariHGroupDistribution, VoucherDistributionItem } from '../types';

// ==========================================
// 1. ID CARD KONSUMSI SYNCHRONIZATION
// ==========================================

export async function fetchIdCardsFromSupabase(): Promise<IDCardKonsumsi[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('id_cards_konsumsi')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('[Supabase] Failed to fetch id_cards_konsumsi:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.id,
      cardCode: row.card_code,
      activationCode: row.activation_code,
      pickupCode: row.pickup_code,
      status: row.status as 'unactivated' | 'active',
      holderName: row.holder_name || undefined,
      holderEmail: row.holder_email || undefined,
      areaKerja: row.area_kerja || undefined,
      kategori: row.kategori || 'Internal',
      activatedAt: row.activated_at || undefined,
      claimedMeals: row.claimed_meals || {
        pagi: { claimed: false },
        siang: { claimed: false },
        malam: { claimed: false },
      },
    }));
  } catch (err) {
    console.error('[Supabase] Error during fetchIdCardsFromSupabase:', err);
    return null;
  }
}

export async function upsertIdCardToSupabase(card: IDCardKonsumsi): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: card.id,
      card_code: card.cardCode,
      activation_code: card.activationCode,
      pickup_code: card.pickupCode,
      status: card.status,
      holder_name: card.holderName || null,
      holder_email: card.holderEmail || null,
      area_kerja: card.areaKerja || null,
      kategori: card.kategori || 'Internal',
      activated_at: card.activatedAt || null,
      claimed_meals: card.claimedMeals || {
        pagi: { claimed: false },
        siang: { claimed: false },
        malam: { claimed: false },
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('id_cards_konsumsi').upsert(payload);
    if (error) {
      console.warn('[Supabase] Error upserting ID Card:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception upserting ID Card:', err);
    return false;
  }
}

export async function bulkUpsertIdCardsToSupabase(cards: IDCardKonsumsi[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || cards.length === 0) return false;

  try {
    const payloads = cards.map((card) => ({
      id: card.id,
      card_code: card.cardCode,
      activation_code: card.activationCode,
      pickup_code: card.pickupCode,
      status: card.status,
      holder_name: card.holderName || null,
      holder_email: card.holderEmail || null,
      area_kerja: card.areaKerja || null,
      kategori: card.kategori || 'Internal',
      activated_at: card.activatedAt || null,
      claimed_meals: card.claimedMeals || {
        pagi: { claimed: false },
        siang: { claimed: false },
        malam: { claimed: false },
      },
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('id_cards_konsumsi').upsert(payloads);
    if (error) {
      console.warn('[Supabase] Bulk upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Bulk upsert exception:', err);
    return false;
  }
}

// ==========================================
// 2. HARI H DISTRIBUTIONS SYNCHRONIZATION
// ==========================================

export async function fetchHariHFromSupabase(): Promise<HariHGroupDistribution[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('hari_h_distributions')
      .select('*')
      .order('no', { ascending: true });

    if (error) {
      console.warn('[Supabase] Failed to fetch hari_h_distributions:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((r: any) => ({
      id: r.id,
      no: r.no,
      groupName: r.group_name,
      picName: r.pic_name,
      picPhone: r.pic_phone || '',
      category: (r.category || 'Internal') as 'Internal' | 'Eksternal' | 'Buffer',
      pagiQty: r.pagi_qty || 0,
      pagiMenu: r.pagi_menu || '',
      pagiStatus: r.pagi_status || 'pending',
      pagiPickedAt: r.pagi_picked_at || undefined,
      pagiReceiver: r.pagi_receiver || undefined,
      snackPagiQty: r.snack_pagi_qty || 0,
      snackPagiMenu: r.snack_pagi_menu || '',
      snackPagiStatus: r.snack_pagi_status || 'pending',
      snackPagiPickedAt: r.snack_pagi_picked_at || undefined,
      snackPagiReceiver: r.snack_pagi_receiver || undefined,
      siangQty: r.siang_qty || 0,
      siangMenu: r.siang_menu || '',
      siangStatus: r.siang_status || 'pending',
      siangPickedAt: r.siang_picked_at || undefined,
      siangReceiver: r.siang_receiver || undefined,
      snackSiangQty: r.snack_siang_qty || 0,
      snackSiangMenu: r.snack_siang_menu || '',
      snackSiangStatus: r.snack_siang_status || 'pending',
      snackSiangPickedAt: r.snack_siang_picked_at || undefined,
      snackSiangReceiver: r.snack_siang_receiver || undefined,
      minumanQty: r.minuman_qty || 0,
      minumanMenu: r.minuman_menu || '',
      minumanStatus: r.minuman_status || 'pending',
      minumanPickedAt: r.minuman_picked_at || undefined,
      minumanReceiver: r.minuman_receiver || undefined,
      malamQty: r.malam_qty || 0,
      malamMenu: r.malam_menu || '',
      malamStatus: r.malam_status || 'pending',
      malamPickedAt: r.malam_picked_at || undefined,
      malamReceiver: r.malam_receiver || undefined,
      totalAmount: r.total_amount || 0,
      notes: r.notes || undefined,
    }));
  } catch (err) {
    console.error('[Supabase] Error during fetchHariHFromSupabase:', err);
    return null;
  }
}

export async function upsertHariHToSupabase(group: HariHGroupDistribution): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: group.id,
      no: group.no,
      group_name: group.groupName,
      pic_name: group.picName,
      pic_phone: group.picPhone || null,
      pagi_qty: group.pagiQty,
      pagi_menu: group.pagiMenu,
      pagi_status: group.pagiStatus,
      pagi_picked_at: group.pagiPickedAt || null,
      pagi_receiver: group.pagiReceiver || null,
      siang_qty: group.siangQty,
      siang_menu: group.siangMenu,
      siang_status: group.siangStatus,
      siang_picked_at: group.siangPickedAt || null,
      siang_receiver: group.siangReceiver || null,
      malam_qty: group.malamQty,
      malam_menu: group.malamMenu,
      malam_status: group.malamStatus,
      malam_picked_at: group.malamPickedAt || null,
      malam_receiver: group.malamReceiver || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('hari_h_distributions').upsert(payload);
    if (error) {
      console.warn('[Supabase] Error upserting Hari H group:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception upserting Hari H group:', err);
    return false;
  }
}

export async function deleteHariHGroupFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('hari_h_distributions').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting Hari H group:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting Hari H group:', err);
    return false;
  }
}

export async function bulkUpsertHariHToSupabase(groups: HariHGroupDistribution[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || groups.length === 0) return false;

  try {
    const payloads = groups.map((group) => ({
      id: group.id,
      no: group.no,
      group_name: group.groupName,
      pic_name: group.picName,
      pic_phone: group.picPhone || null,
      pagi_qty: group.pagiQty,
      pagi_menu: group.pagiMenu,
      pagi_status: group.pagiStatus,
      pagi_picked_at: group.pagiPickedAt || null,
      pagi_receiver: group.pagiReceiver || null,
      snack_pagi_qty: group.snackPagiQty || 0,
      snack_pagi_menu: group.snackPagiMenu || '',
      snack_pagi_status: group.snackPagiStatus || 'pending',
      snack_pagi_picked_at: group.snackPagiPickedAt || null,
      snack_pagi_receiver: group.snackPagiReceiver || null,
      siang_qty: group.siangQty,
      siang_menu: group.siangMenu,
      siang_status: group.siangStatus,
      siang_picked_at: group.siangPickedAt || null,
      siang_receiver: group.siangReceiver || null,
      snack_siang_qty: group.snackSiangQty || 0,
      snack_siang_menu: group.snackSiangMenu || '',
      snack_siang_status: group.snackSiangStatus || 'pending',
      snack_siang_picked_at: group.snackSiangPickedAt || null,
      snack_siang_receiver: group.snackSiangReceiver || null,
      minuman_qty: group.minumanQty || 0,
      minuman_menu: group.minumanMenu || '',
      minuman_status: group.minumanStatus || 'pending',
      minuman_picked_at: group.minumanPickedAt || null,
      minuman_receiver: group.minumanReceiver || null,
      malam_qty: group.malamQty,
      malam_menu: group.malamMenu,
      malam_status: group.malamStatus,
      malam_picked_at: group.malamPickedAt || null,
      malam_receiver: group.malamReceiver || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('hari_h_distributions').upsert(payloads);
    if (error) {
      console.warn('[Supabase] Bulk upsert Hari H error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Bulk upsert Hari H exception:', err);
    return false;
  }
}

// ==========================================
// 3. VOUCHERS SYNCHRONIZATION
// ==========================================

export async function fetchVouchersFromSupabase(): Promise<VoucherDistributionItem[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('vouchers')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('[Supabase] Failed to fetch vouchers:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((v: any) => {
      // Determine mealType properly
      let mealType: 'Makan Siang' | 'Makan Malam' | 'Minuman' = 'Makan Siang';
      if (v.meal_type === 'Makan Malam' || v.meal_type === 'Minuman' || v.meal_type === 'Makan Siang') {
        mealType = v.meal_type;
      } else if (v.id?.includes('malam') || (v.menu_vendor && v.menu_vendor.toLowerCase().includes('malam'))) {
        mealType = 'Makan Malam';
      } else if (v.id?.includes('minum') || (v.menu_vendor && v.menu_vendor.toLowerCase().includes('mineral'))) {
        mealType = 'Minuman';
      }

      // Calculate proper unit price and total price if missing
      let unitPrice = v.unit_price || 0;
      let totalPrice = v.total_price || 0;
      if (totalPrice === 0) {
        if (v.day === 'H-2' || v.day === 'H+1') {
          unitPrice = 25000;
          totalPrice = (v.qty || 0) * unitPrice;
        } else if (mealType === 'Makan Siang') {
          unitPrice = 29500;
          totalPrice = (v.qty || 0) * unitPrice;
        } else if (mealType === 'Makan Malam') {
          unitPrice = 22000;
          totalPrice = (v.qty || 0) * unitPrice;
        } else if (mealType === 'Minuman') {
          unitPrice = 850000;
          totalPrice = 850000;
        }
      }

      return {
        id: v.id,
        day: (v.day || 'H-1') as 'H-2' | 'H-1' | 'H+1',
        groupNo: v.group_no,
        groupName: v.group_name,
        picName: v.pic_name,
        picPhone: v.pic_phone || '',
        mealType: mealType,
        qty: v.qty,
        menuVendor: v.menu_vendor,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        status: (v.status === 'claimed' ? 'claimed' : v.status === 'cancelled' ? 'cancelled' : 'pending') as 'pending' | 'claimed' | 'cancelled',
        claimedAt: v.claimed_at || undefined,
        receiverName: v.receiver_name || undefined,
        voucherCode: v.voucher_code || undefined,
        notes: v.notes || undefined,
      };
    });
  } catch (err) {
    console.error('[Supabase] Error during fetchVouchersFromSupabase:', err);
    return null;
  }
}

export async function upsertVoucherToSupabase(voucher: VoucherDistributionItem): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: voucher.id,
      day: voucher.day,
      group_no: voucher.groupNo,
      group_name: voucher.groupName,
      pic_name: voucher.picName,
      pic_phone: voucher.picPhone || null,
      qty: voucher.qty,
      menu_vendor: voucher.menuVendor,
      meal_type: voucher.mealType,
      unit_price: voucher.unitPrice,
      total_price: voucher.totalPrice,
      status: voucher.status,
      claimed_at: voucher.claimedAt || null,
      receiver_name: voucher.receiverName || null,
      voucher_code: voucher.voucherCode || null,
      notes: voucher.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('vouchers').upsert(payload);
    if (error) {
      console.warn('[Supabase] Error upserting voucher:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception upserting voucher:', err);
    return false;
  }
}

export async function bulkUpsertVouchersToSupabase(vouchers: VoucherDistributionItem[]): Promise<boolean> {
  const client = getSupabase();
  if (!client || vouchers.length === 0) return false;

  try {
    const payloads = vouchers.map((voucher) => ({
      id: voucher.id,
      day: voucher.day,
      group_no: voucher.groupNo,
      group_name: voucher.groupName,
      pic_name: voucher.picName,
      pic_phone: voucher.picPhone || null,
      qty: voucher.qty,
      menu_vendor: voucher.menuVendor,
      meal_type: voucher.mealType,
      unit_price: voucher.unitPrice,
      total_price: voucher.totalPrice,
      status: voucher.status,
      claimed_at: voucher.claimedAt || null,
      receiver_name: voucher.receiverName || null,
      voucher_code: voucher.voucherCode || null,
      notes: voucher.notes || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('vouchers').upsert(payloads);
    if (error) {
      console.warn('[Supabase] Bulk upsert vouchers error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Bulk upsert vouchers exception:', err);
    return false;
  }
}

export async function deleteVoucherFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('vouchers').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting voucher:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting voucher:', err);
    return false;
  }
}

export { isSupabaseConfigured };
