import { getSupabase, isSupabaseConfigured } from './supabase';
import { IDCardKonsumsi, HariHGroupDistribution, VoucherDistributionItem, MealTimeSlot } from '../types';

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

export async function deleteIdCardFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('id_cards_konsumsi').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting ID Card from database:', error.message);
      return false;
    }
    console.log('[Supabase] Successfully deleted ID Card:', id);
    return true;
  } catch (err) {
    console.error('[Supabase] Exception deleting ID Card:', err);
    return false;
  }
}

// ==========================================
// 2. HARI H DISTRIBUTIONS SYNCHRONIZATION
// ==========================================

// Helper to extract and format notes, members, and H-1 backup
function extractGroupNotesAndMembers(notesRaw?: string | null, membersRaw?: string | null) {
  let membersVal = membersRaw || undefined;
  let notesVal = notesRaw || undefined;

  let h1Data: {
    sq?: number; sm?: string; ss?: string; sp?: string; sr?: string;
    mq?: number; mm?: string; ms?: string; mp?: string; mr?: string;
  } | null = null;

  if (notesVal && typeof notesVal === 'string') {
    // 1. Extract [H1_DATA:...]
    const h1Match = notesVal.match(/\[H1_DATA:([^\]]+)\]/);
    if (h1Match && h1Match[1]) {
      try {
        h1Data = JSON.parse(h1Match[1]);
      } catch (e) {
        // ignore json parse error
      }
      notesVal = notesVal.replace(/\[H1_DATA:[^\]]+\]/g, '').trim();
    }

    // 2. Extract Anggota: ...
    if (notesVal.toLowerCase().includes('anggota:')) {
      const match = notesVal.match(/Anggota:\s*([^|]+)/i);
      if (match && match[1] && !membersVal) {
        membersVal = match[1].trim();
      }
      notesVal = notesVal.replace(/Anggota:\s*[^|]+/i, '').trim();
    }

    // Clean up lingering separators
    notesVal = notesVal.replace(/^[|\s]+|[|\s]+$/g, '').trim() || undefined;
  }

  return { membersVal, notesVal, h1Data };
}

function buildComputedGroupNotes(group: HariHGroupDistribution): string | null {
  const parts: string[] = [];
  
  // Clean base note
  if (group.notes && group.notes.trim()) {
    let clean = group.notes
      .replace(/\[H1_DATA:[^\]]+\]/g, '')
      .replace(/Anggota:\s*[^|]+/i, '')
      .replace(/^[|\s]+|[|\s]+$/g, '')
      .trim();
    if (clean) parts.push(clean);
  }

  // Add members
  if (group.members && group.members.trim()) {
    parts.push(`Anggota: ${group.members.trim()}`);
  }

  // Backup H-1 data inside notes for legacy database schemas
  const h1Backup = {
    sq: group.h1SiangQty || 0,
    sm: group.h1SiangMenu || 'Nasi Ladas',
    ss: group.h1SiangStatus || 'pending',
    sp: group.h1SiangPickedAt || '',
    sr: group.h1SiangReceiver || '',
    mq: group.h1MalamQty || 0,
    mm: group.h1MalamMenu || 'Nasi Padang Puti Minang',
    ms: group.h1MalamStatus || 'pending',
    mp: group.h1MalamPickedAt || '',
    mr: group.h1MalamReceiver || '',
  };
  parts.push(`[H1_DATA:${JSON.stringify(h1Backup)}]`);

  return parts.length > 0 ? parts.join(' | ') : null;
}

const H1_COLUMNS = [
  'h1_siang_qty', 'h1_siang_menu', 'h1_siang_status', 'h1_siang_picked_at', 'h1_siang_receiver',
  'h1_malam_qty', 'h1_malam_menu', 'h1_malam_status', 'h1_malam_picked_at', 'h1_malam_receiver'
];

function stripH1AndOptionalColumns(payload: Record<string, any>, stripAllOptional = false): Record<string, any> {
  const clean = { ...payload };
  delete clean.members;
  H1_COLUMNS.forEach((col) => delete clean[col]);
  
  if (stripAllOptional) {
    delete clean.category;
    delete clean.total_amount;
    delete clean.snack_pagi_qty;
    delete clean.snack_pagi_menu;
    delete clean.snack_pagi_status;
    delete clean.snack_pagi_picked_at;
    delete clean.snack_pagi_receiver;
    delete clean.snack_siang_qty;
    delete clean.snack_siang_menu;
    delete clean.snack_siang_status;
    delete clean.snack_siang_picked_at;
    delete clean.snack_siang_receiver;
    delete clean.minuman_qty;
    delete clean.minuman_menu;
    delete clean.minuman_status;
    delete clean.minuman_picked_at;
    delete clean.minuman_receiver;
  }
  return clean;
}

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

    return data.map((r: any) => {
      let cat: 'Internal' | 'Eksternal' | 'Buffer' = 'Internal';
      if (r.category === 'Eksternal' || r.category === 'Buffer') {
        cat = r.category;
      } else if (r.no === 64 || r.group_name?.toLowerCase().includes('buffer') || r.group_name?.toLowerCase().includes('cadangan')) {
        cat = 'Buffer';
      } else if (r.no >= 40) {
        cat = 'Eksternal';
      } else if (r.category === 'Internal') {
        cat = 'Internal';
      }

      // Extract members, clean notes, and any H1 backup from notes
      const { membersVal, notesVal, h1Data } = extractGroupNotesAndMembers(r.notes, r.members);

      // Determine H-1 Siang values (prefer explicit note/column if configured, fallback to Panitia MD & Buffer defaults)
      let h1SiangQty = 0;
      if (h1Data && h1Data.sq !== undefined && h1Data.sq !== null) {
        h1SiangQty = Number(h1Data.sq);
      } else if (r.h1_siang_qty !== undefined && r.h1_siang_qty !== null && Number(r.h1_siang_qty) > 0) {
        h1SiangQty = Number(r.h1_siang_qty);
      } else if (r.no <= 14) {
        h1SiangQty = r.siang_qty || 2;
      } else if (r.no === 64) {
        h1SiangQty = 5;
      } else if (r.h1_siang_qty !== undefined && r.h1_siang_qty !== null) {
        h1SiangQty = Number(r.h1_siang_qty);
      }
      
      const h1SiangMenu = r.h1_siang_menu || h1Data?.sm || 'Nasi Ladas';
      const h1SiangStatus = (r.h1_siang_status || h1Data?.ss || 'pending') as 'pending' | 'completed';
      const h1SiangPickedAt = r.h1_siang_picked_at || h1Data?.sp || undefined;
      const h1SiangReceiver = r.h1_siang_receiver || h1Data?.sr || undefined;

      // Determine H-1 Malam values (prefer explicit note/column if configured, fallback to Panitia MD & Buffer defaults)
      let h1MalamQty = 0;
      if (h1Data && h1Data.mq !== undefined && h1Data.mq !== null) {
        h1MalamQty = Number(h1Data.mq);
      } else if (r.h1_malam_qty !== undefined && r.h1_malam_qty !== null && Number(r.h1_malam_qty) > 0) {
        h1MalamQty = Number(r.h1_malam_qty);
      } else if (r.no <= 14) {
        h1MalamQty = r.malam_qty || 2;
      } else if (r.no === 64) {
        h1MalamQty = 10;
      } else if (r.h1_malam_qty !== undefined && r.h1_malam_qty !== null) {
        h1MalamQty = Number(r.h1_malam_qty);
      }

      const h1MalamMenu = r.h1_malam_menu || h1Data?.mm || 'Nasi Padang Puti Minang';
      const h1MalamStatus = (r.h1_malam_status || h1Data?.ms || 'pending') as 'pending' | 'completed';
      const h1MalamPickedAt = r.h1_malam_picked_at || h1Data?.mp || undefined;
      const h1MalamReceiver = r.h1_malam_receiver || h1Data?.mr || undefined;

      return {
        id: r.id,
        no: r.no,
        groupName: r.group_name,
        picName: r.pic_name,
        picPhone: r.pic_phone || '',
        category: cat,
        h1SiangQty: Number(h1SiangQty) || 0,
        h1SiangMenu: h1SiangMenu,
        h1SiangStatus: h1SiangStatus,
        h1SiangPickedAt: h1SiangPickedAt,
        h1SiangReceiver: h1SiangReceiver,
        h1MalamQty: Number(h1MalamQty) || 0,
        h1MalamMenu: h1MalamMenu,
        h1MalamStatus: h1MalamStatus,
        h1MalamPickedAt: h1MalamPickedAt,
        h1MalamReceiver: h1MalamReceiver,
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
        members: membersVal || undefined,
        notes: notesVal || undefined,
      };
    });
  } catch (err) {
    console.error('[Supabase] Error during fetchHariHFromSupabase:', err);
    return null;
  }
}

export async function updateHariHSlotInSupabase(
  groupId: string,
  slot: MealTimeSlot,
  status: 'pending' | 'completed',
  pickedAt?: string,
  receiver?: string,
  note?: string,
  groupNo?: number
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (slot === 'h1_siang') {
      updateData.h1_siang_status = status;
      updateData.h1_siang_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.h1_siang_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'h1_malam') {
      updateData.h1_malam_status = status;
      updateData.h1_malam_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.h1_malam_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'pagi') {
      updateData.pagi_status = status;
      updateData.pagi_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.pagi_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'snack_pagi') {
      updateData.snack_pagi_status = status;
      updateData.snack_pagi_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.snack_pagi_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'siang') {
      updateData.siang_status = status;
      updateData.siang_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.siang_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'snack_siang') {
      updateData.snack_siang_status = status;
      updateData.snack_siang_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.snack_siang_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'minuman') {
      updateData.minuman_status = status;
      updateData.minuman_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.minuman_receiver = status === 'completed' ? (receiver || null) : null;
    } else if (slot === 'malam') {
      updateData.malam_status = status;
      updateData.malam_picked_at = status === 'completed' ? (pickedAt || null) : null;
      updateData.malam_receiver = status === 'completed' ? (receiver || null) : null;
    }

    if (note !== undefined) {
      updateData.notes = note || null;
    }

    // Try update by id
    let { data: updatedRows, error } = await client
      .from('hari_h_distributions')
      .update(updateData)
      .eq('id', groupId)
      .select('id');

    // If failed because column does not exist (e.g. h1_siang_status or notes missing in older schemas)
    if (error && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      console.warn(`[Supabase] Column error updating slot ${slot}:`, error.message, 'Trying fallback without newly added slot columns...');
      
      // If it failed because H-1 column doesn't exist yet, we save H-1 status inside notes
      if (slot === 'h1_siang' || slot === 'h1_malam') {
        try {
          const { data: currentGroup } = await client
            .from('hari_h_distributions')
            .select('notes')
            .eq('id', groupId)
            .maybeSingle();

          const { membersVal, notesVal, h1Data } = extractGroupNotesAndMembers(currentGroup?.notes);
          const currentH1 = h1Data || {};
          if (slot === 'h1_siang') {
            currentH1.ss = status;
            currentH1.sp = status === 'completed' ? (pickedAt || '') : '';
            currentH1.sr = status === 'completed' ? (receiver || '') : '';
          } else {
            currentH1.ms = status;
            currentH1.mp = status === 'completed' ? (pickedAt || '') : '';
            currentH1.mr = status === 'completed' ? (receiver || '') : '';
          }

          const fallbackNotesParts: string[] = [];
          if (notesVal) fallbackNotesParts.push(notesVal);
          if (membersVal) fallbackNotesParts.push(`Anggota: ${membersVal}`);
          fallbackNotesParts.push(`[H1_DATA:${JSON.stringify(currentH1)}]`);
          if (note) fallbackNotesParts.push(note);

          const fallbackUpdate = await client
            .from('hari_h_distributions')
            .update({
              notes: fallbackNotesParts.join(' | '),
              updated_at: new Date().toISOString()
            })
            .eq('id', groupId)
            .select('id');

          if (!fallbackUpdate.error) {
            console.log(`[Supabase] H-1 slot ${slot} successfully persisted into notes backup`);
            return { success: true };
          }
        } catch (fbErr) {
          console.warn('[Supabase] Fallback note update failed:', fbErr);
        }
      }

      // Retry without notes if note was the issue
      const retryData = { ...updateData };
      delete retryData.notes;
      const retry = await client
        .from('hari_h_distributions')
        .update(retryData)
        .eq('id', groupId)
        .select('id');
      error = retry.error;
      updatedRows = retry.data;
    }

    // If 0 rows updated by id and groupNo is provided, try update by 'no'
    if (!error && (!updatedRows || updatedRows.length === 0) && groupNo !== undefined) {
      console.log(`[Supabase] Row not found by id=${groupId}, trying update by no=${groupNo}`);
      const byNo = await client
        .from('hari_h_distributions')
        .update(updateData)
        .eq('no', groupNo)
        .select('id');
      if (byNo.error) {
        error = byNo.error;
      }
    }

    if (error) {
      console.error('[Supabase] Error updating Hari H slot:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase] Successfully updated Hari H slot (${slot} -> ${status}) for group: ${groupId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception updating Hari H slot:', err);
    return { success: false, error: err?.message || 'Gagal update ke database' };
  }
}

export async function updateVoucherStatusInSupabase(
  id: string,
  status: 'pending' | 'claimed' | 'cancelled',
  claimedAt?: string,
  receiverName?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };

  try {
    const updateData: Record<string, any> = {
      status: status,
      claimed_at: status === 'claimed' ? (claimedAt || null) : null,
      receiver_name: status === 'claimed' ? (receiverName || null) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('vouchers')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error updating voucher status:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase] Successfully updated voucher status (${status}) for: ${id}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception updating voucher status:', err);
    return { success: false, error: err?.message || 'Gagal update voucher' };
  }
}

export async function upsertHariHToSupabase(group: HariHGroupDistribution): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };

  try {
    const category = group.category || (group.no === 64 ? 'Buffer' : (group.no >= 40 ? 'Eksternal' : 'Internal'));
    const computedNotes = buildComputedGroupNotes(group);

    const payload: Record<string, any> = {
      id: group.id,
      no: group.no,
      group_name: group.groupName,
      pic_name: group.picName,
      pic_phone: group.picPhone || null,
      category: category,
      h1_siang_qty: group.h1SiangQty || 0,
      h1_siang_menu: group.h1SiangMenu || 'Nasi Ladas',
      h1_siang_status: group.h1SiangStatus || 'pending',
      h1_siang_picked_at: group.h1SiangPickedAt || null,
      h1_siang_receiver: group.h1SiangReceiver || null,
      h1_malam_qty: group.h1MalamQty || 0,
      h1_malam_menu: group.h1MalamMenu || 'Nasi Padang Puti Minang',
      h1_malam_status: group.h1MalamStatus || 'pending',
      h1_malam_picked_at: group.h1MalamPickedAt || null,
      h1_malam_receiver: group.h1MalamReceiver || null,
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
      members: group.members || null,
      notes: computedNotes,
      updated_at: new Date().toISOString(),
    };

    // Direct UPSERT (inserts if new, updates if existing)
    let { error } = await client.from('hari_h_distributions').upsert(payload);

    // If upsert failed due to missing columns in user's schema (e.g. h1_siang_* or members)
    if (error && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      console.warn('[Supabase] Missing column detected during Hari H upsert:', error.message, 'Trying fallback without new columns (data preserved in notes)...');
      const fallbackPayload = stripH1AndOptionalColumns(payload, false);
      const retryUpsert = await client
        .from('hari_h_distributions')
        .upsert(fallbackPayload);
      error = retryUpsert.error;

      // If still error, strip older optional columns
      if (error && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
        const ultraFallback = stripH1AndOptionalColumns(payload, true);
        const retryUltra = await client
          .from('hari_h_distributions')
          .upsert(ultraFallback);
        error = retryUltra.error;
      }
    }

    if (error) {
      console.error('[Supabase] Error upserting Hari H group:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] Successfully upserted Hari H group:', group.id, group.groupName);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception upserting Hari H group:', err);
    return { success: false, error: err?.message || 'Gagal update data' };
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
    const payloads = groups.map((group) => {
      const category = group.category || (group.no === 64 ? 'Buffer' : (group.no >= 40 ? 'Eksternal' : 'Internal'));
      const computedNotes = buildComputedGroupNotes(group);
      return {
        id: group.id,
        no: group.no,
        group_name: group.groupName,
        pic_name: group.picName,
        pic_phone: group.picPhone || null,
        category: category,
        h1_siang_qty: group.h1SiangQty || 0,
        h1_siang_menu: group.h1SiangMenu || 'Nasi Ladas',
        h1_siang_status: group.h1SiangStatus || 'pending',
        h1_siang_picked_at: group.h1SiangPickedAt || null,
        h1_siang_receiver: group.h1SiangReceiver || null,
        h1_malam_qty: group.h1MalamQty || 0,
        h1_malam_menu: group.h1MalamMenu || 'Nasi Padang Puti Minang',
        h1_malam_status: group.h1MalamStatus || 'pending',
        h1_malam_picked_at: group.h1MalamPickedAt || null,
        h1_malam_receiver: group.h1MalamReceiver || null,
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
        members: group.members || null,
        notes: computedNotes,
        updated_at: new Date().toISOString(),
      };
    });

    let { error } = await client.from('hari_h_distributions').upsert(payloads);
    if (error && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('does not exist'))) {
      console.warn('[Supabase] Missing column during bulk upsert Hari H, using fallback payloads...');
      const fallbackPayloads = payloads.map((p) => stripH1AndOptionalColumns(p, false));
      const retry = await client.from('hari_h_distributions').upsert(fallbackPayloads);
      if (!retry.error) return true;
      
      const ultraFallbackPayloads = payloads.map((p) => stripH1AndOptionalColumns(p, true));
      const retryUltra = await client.from('hari_h_distributions').upsert(ultraFallbackPayloads);
      if (!retryUltra.error) return true;
      error = retryUltra.error;
    }
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

export async function syncHariHCategoriesInSupabase(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    // 1. Update Eksternal (no 40 to 63)
    await client
      .from('hari_h_distributions')
      .update({ category: 'Eksternal', updated_at: new Date().toISOString() })
      .gte('no', 40)
      .lt('no', 64);

    // 2. Update Buffer (no 64)
    await client
      .from('hari_h_distributions')
      .update({ category: 'Buffer', updated_at: new Date().toISOString() })
      .eq('no', 64);

    // 3. Update Internal (no 1 to 39)
    await client
      .from('hari_h_distributions')
      .update({ category: 'Internal', updated_at: new Date().toISOString() })
      .lt('no', 40);

    console.log('[Supabase] Successfully synchronized categories in database (Internal / Eksternal / Buffer)');
  } catch (err) {
    console.warn('[Supabase] Exception during syncHariHCategoriesInSupabase:', err);
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

      // Extract members and cleaned notes for voucher
      let vMembersVal = v.members;
      let vNotesVal = v.notes;
      if (!vMembersVal && vNotesVal && typeof vNotesVal === 'string' && vNotesVal.toLowerCase().includes('anggota:')) {
        const match = vNotesVal.match(/Anggota:\s*([^|]+)/i);
        if (match && match[1]) {
          vMembersVal = match[1].trim();
          vNotesVal = vNotesVal.replace(/Anggota:\s*[^|]+/i, '').replace(/\|\s*$/, '').replace(/^\s*\|\s*/, '').trim() || undefined;
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
        members: vMembersVal || undefined,
        notes: vNotesVal || undefined,
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
    let computedNotes = voucher.notes || null;
    if (voucher.members && voucher.members.trim()) {
      const cleanNote = voucher.notes ? voucher.notes.replace(/Anggota:\s*[^|]+/i, '').replace(/\|\s*$/, '').replace(/^\s*\|\s*/, '').trim() : '';
      computedNotes = cleanNote ? `${cleanNote} | Anggota: ${voucher.members.trim()}` : `Anggota: ${voucher.members.trim()}`;
    }

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
      members: voucher.members || null,
      notes: computedNotes,
      updated_at: new Date().toISOString(),
    };

    let { error } = await client.from('vouchers').upsert(payload);
    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const basePayload = { ...payload };
      delete (basePayload as any).members;
      const retry = await client.from('vouchers').upsert(basePayload);
      if (!retry.error) return true;
      error = retry.error;
    }
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
    const payloads = vouchers.map((voucher) => {
      let computedNotes = voucher.notes || null;
      if (voucher.members && voucher.members.trim()) {
        const cleanNote = voucher.notes ? voucher.notes.replace(/Anggota:\s*[^|]+/i, '').replace(/\|\s*$/, '').replace(/^\s*\|\s*/, '').trim() : '';
        computedNotes = cleanNote ? `${cleanNote} | Anggota: ${voucher.members.trim()}` : `Anggota: ${voucher.members.trim()}`;
      }
      return {
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
        members: voucher.members || null,
        notes: computedNotes,
        updated_at: new Date().toISOString(),
      };
    });

    let { error } = await client.from('vouchers').upsert(payloads);
    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const fallbackPayloads = payloads.map((p) => {
        const copy = { ...p };
        delete (copy as any).members;
        return copy;
      });
      const retry = await client.from('vouchers').upsert(fallbackPayloads);
      if (!retry.error) return true;
      error = retry.error;
    }
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

export async function deleteVoucherFromSupabase(
  itemOrId: string | { id: string; voucherCode?: string }
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    console.warn('[Supabase] Client not initialized, skipping deletion from DB');
    return { success: false, error: 'Koneksi Supabase belum aktif atau URL/Key belum dikonfigurasi.' };
  }

  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
  const voucherCode = typeof itemOrId === 'object' ? itemOrId.voucherCode : undefined;

  try {
    // 1. Try deleting by primary key id
    const { data, error } = await client
      .from('vouchers')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.warn(`[Supabase] Error deleting voucher id "${id}":`, error.message);
      return { success: false, error: error.message };
    }

    // 2. If no rows matched by ID and voucherCode is provided, try deleting by voucher_code
    if ((!data || data.length === 0) && voucherCode) {
      const codeRes = await client
        .from('vouchers')
        .delete()
        .eq('voucher_code', voucherCode)
        .select();

      if (codeRes.error) {
        console.warn(`[Supabase] Error deleting voucher by code "${voucherCode}":`, codeRes.error.message);
        return { success: false, error: codeRes.error.message };
      }
    }

    console.log(`[Supabase] Successfully deleted voucher from database: ${id}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception deleting voucher:', err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat menghapus data di Supabase.' };
  }
}

export { isSupabaseConfigured };
