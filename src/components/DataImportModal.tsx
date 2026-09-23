import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  Database, 
  Check, 
  AlertCircle, 
  FileText, 
  Download, 
  Layers, 
  RefreshCw,
  Sparkles,
  CreditCard,
  Clock,
  Ticket
} from 'lucide-react';
import { IDCardKonsumsi, HariHGroupDistribution, VoucherDistributionItem } from '../types';
import { 
  bulkUpsertIdCardsToSupabase, 
  bulkUpsertHariHToSupabase, 
  bulkUpsertVouchersToSupabase 
} from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

export type ImportCategory = 'id_cards' | 'hari_h' | 'vouchers';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ImportCategory;
  initialCategory?: ImportCategory;
  onImportIdCards: (newCards: IDCardKonsumsi[], mode: 'replace' | 'merge') => void;
  onImportHariH: (newGroups: HariHGroupDistribution[], mode: 'replace' | 'merge') => void;
  onImportVouchers: (newVouchers: VoucherDistributionItem[], mode: 'replace' | 'merge') => void;
  currentIdCardsCount?: number;
  currentHariHCount?: number;
  currentVouchersCount?: number;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  initialCategory = 'id_cards',
  onImportIdCards,
  onImportHariH,
  onImportVouchers,
  currentIdCardsCount = 0,
  currentHariHCount = 0,
  currentVouchersCount = 0,
}) => {
  const [category, setCategory] = useState<ImportCategory>(defaultCategory || initialCategory || 'id_cards');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync category when modal opens or initialCategory changes
  React.useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory || initialCategory || 'id_cards');
      setParseError(null);
      setSaveStatus(null);
    }
  }, [isOpen, defaultCategory, initialCategory]);

  if (!isOpen) return null;

  const isCloudActive = isSupabaseConfigured();

  // Helper to parse CSV/TSV safely
  const parseDelimitedText = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Data harus memiliki minimal 1 baris header dan 1 baris data.');
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const rows = lines.slice(1).map((line) => {
      const values = parseLine(line);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      return rowObj;
    });

    return rows;
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    setParseError(null);
    setSaveStatus(null);

    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    try {
      // Check if JSON
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const arrayData = Array.isArray(parsed) ? parsed : [parsed];
        setParsedRows(arrayData);
        return;
      }

      const rows = parseDelimitedText(text);
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca format data.');
      setParsedRows([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  // Convert raw rows to strongly typed ID Cards
  const convertToIdCards = (rawList: any[]): IDCardKonsumsi[] => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return rawList.map((row, idx) => {
      const indexNum = idx + 1;
      const formattedNum = String(indexNum).padStart(3, '0');
      const id = row.id || row.idcard || row['id card'] || `IDC-${formattedNum}`;
      const cardCode = row.card_code || row.cardcode || row['nomor seri'] || `HBD-2026-${formattedNum}`;
      const activationCode = row.activation_code || `ACT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const pickupCode = row.pickup_code || `PCK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const holderName = row.holder_name || row.nama || row['nama lengkap'] || row.name || row.pemegang || '';
      const holderEmail = row.holder_email || row.email || '';
      const areaKerja = row.area_kerja || row['area kerja'] || row.area || row.divisi || row.pos || 'Koordinator & Steering Committee';
      const kategori = (row.kategori || row.category || 'Internal') as 'Internal' | 'Mobile' | 'Eksternal';
      
      const isAlreadyActive = Boolean(holderName && holderName.trim().length > 0);

      return {
        id,
        cardCode,
        activationCode,
        pickupCode,
        status: isAlreadyActive ? 'active' : 'unactivated',
        holderName: holderName || undefined,
        holderEmail: holderEmail || undefined,
        areaKerja: areaKerja || undefined,
        kategori,
        activatedAt: isAlreadyActive ? (row.activated_at || row.waktu_aktivasi || now) : undefined,
        claimedMeals: {
          pagi: { 
            claimed: String(row.pagi || row['makan pagi'] || '').toLowerCase().includes('sudah') || String(row.pagi || '') === '1' || String(row.pagi || '').toLowerCase() === 'true',
            pickedAt: row.pagi_picked_at || undefined
          },
          siang: { 
            claimed: String(row.siang || row['makan siang'] || '').toLowerCase().includes('sudah') || String(row.siang || '') === '1' || String(row.siang || '').toLowerCase() === 'true',
            pickedAt: row.siang_picked_at || undefined
          },
          malam: { 
            claimed: String(row.malam || row['makan malam'] || '').toLowerCase().includes('sudah') || String(row.malam || '') === '1' || String(row.malam || '').toLowerCase() === 'true',
            pickedAt: row.malam_picked_at || undefined
          },
        }
      };
    });
  };

  // Convert raw rows to Hari H Distributions
  const convertToHariH = (rawList: any[]): HariHGroupDistribution[] => {
    return rawList.map((row, idx) => {
      const no = Number(row.no || row.nomor || idx + 1);
      const id = row.id || `hari-h-${no}`;
      const groupName = row.group_name || row.group || row['nama grup'] || row.divisi || `Grup ${no}`;
      const picName = row.pic_name || row.pic || row['nama pic'] || 'PIC Lapangan';
      const picPhone = row.pic_phone || row.phone || row['no wa'] || row.kontak || '';

      // Support Anggota Makan / Penerima Porsi
      const members = row.members || row.anggota || row['daftar anggota'] || row['nama anggota'] || row['anggota makan'] || row.peserta || '';
      const notes = row.notes || row.catatan || row.keterangan || (members ? `Anggota: ${members}` : '');

      const pagiQty = parseInt(row.pagi_qty || row.pagi || row['qty pagi'] || '0', 10) || 0;
      const pagiMenu = row.pagi_menu || row['menu pagi'] || (pagiQty > 0 ? 'Nasi Kuning Komplit + Telur Balado' : '');
      const pagiStatus = (row.pagi_status || (pagiQty > 0 ? 'pending' : 'pending')) as any;

      const siangQty = parseInt(row.siang_qty || row.siang || row['qty siang'] || '0', 10) || 0;
      const siangMenu = row.siang_menu || row['menu siang'] || (siangQty > 0 ? 'Ayam Bakar Madu + Lalapan' : '');
      const siangStatus = (row.siang_status || (siangQty > 0 ? 'pending' : 'pending')) as any;

      const malamQty = parseInt(row.malam_qty || row.malam || row['qty malam'] || '0', 10) || 0;
      const malamMenu = row.malam_menu || row['menu malam'] || (malamQty > 0 ? 'Nasi Goreng Spesial HBD' : '');
      const malamStatus = (row.malam_status || (malamQty > 0 ? 'pending' : 'pending')) as any;

      return {
        id,
        no,
        groupName,
        picName,
        picPhone,
        category: (row.category || row.kategori || 'Internal') as any,
        pagiQty,
        pagiMenu,
        pagiStatus,
        snackPagiQty: 0,
        snackPagiMenu: '',
        snackPagiStatus: 'pending',
        siangQty,
        siangMenu,
        siangStatus,
        snackSiangQty: 0,
        snackSiangMenu: '',
        snackSiangStatus: 'pending',
        minumanQty: 0,
        minumanMenu: '',
        minumanStatus: 'pending',
        malamQty,
        malamMenu,
        malamStatus,
        totalAmount: 0,
        members: members || undefined,
        notes: notes || undefined,
      };
    });
  };

  // Convert raw rows to Vouchers
  const convertToVouchers = (rawList: any[]): VoucherDistributionItem[] => {
    return rawList.map((row, idx) => {
      const id = row.id || `vch-${idx + 1}`;
      const day = (row.day || row.hari || 'H-1') as 'H-2' | 'H-1' | 'H+1';
      const groupNo = parseInt(row.group_no || row.no || String(idx + 1), 10) || (idx + 1);
      const groupName = row.group_name || row.grup || row.divisi || `Grup ${groupNo}`;
      const picName = row.pic_name || row.pic || 'PIC Lapangan';
      const picPhone = row.pic_phone || row.phone || row['no wa'] || '';
      const qty = parseInt(row.qty || row.jumlah || row.porsi || '10', 10) || 10;
      const menuVendor = row.menu_vendor || row.vendor || row.menu || 'Resto Partner HBD';
      const status = (row.status || 'pending') as any;
      const members = row.members || row.anggota || row['daftar anggota'] || row['nama anggota'] || '';
      const notes = row.notes || row.catatan || (members ? `Anggota: ${members}` : '');

      return {
        id,
        day,
        groupNo,
        groupName,
        picName,
        picPhone,
        mealType: 'Makan Siang',
        qty,
        menuVendor,
        unitPrice: 0,
        totalPrice: 0,
        status,
        voucherCode: row.voucher_code || row.kode || `VCH-${day}-${groupNo}`,
        members: members || undefined,
        notes: notes || undefined,
      };
    });
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      alert('Tidak ada data yang valid untuk diimport.');
      return;
    }

    setIsProcessing(true);
    setSaveStatus('Sedang menyimpan dan menyinkronkan ke Supabase Cloud Database...');

    try {
      if (category === 'id_cards') {
        const idCardsData = convertToIdCards(parsedRows);
        // 1. Sync to Supabase
        const cloudOk = await bulkUpsertIdCardsToSupabase(idCardsData);
        // 2. Update React State
        onImportIdCards(idCardsData, importMode);
        
        setSaveStatus(
          cloudOk 
            ? `Berhasil! ${idCardsData.length} data ID Card tersimpan ke Supabase dan sistem lokal.`
            : `Data ID Card diperbarui secara lokal. (${idCardsData.length} baris)`
        );
      } else if (category === 'hari_h') {
        const hariHData = convertToHariH(parsedRows);
        // 1. Sync to Supabase
        const cloudOk = await bulkUpsertHariHToSupabase(hariHData);
        // 2. Update React State
        onImportHariH(hariHData, importMode);

        setSaveStatus(
          cloudOk 
            ? `Berhasil! ${hariHData.length} grup distribusi Hari H tersimpan ke Supabase.`
            : `Data Hari H diperbarui secara lokal. (${hariHData.length} baris)`
        );
      } else if (category === 'vouchers') {
        const vouchersData = convertToVouchers(parsedRows);
        // 1. Sync to Supabase
        const cloudOk = await bulkUpsertVouchersToSupabase(vouchersData);
        // 2. Update React State
        onImportVouchers(vouchersData, importMode);

        setSaveStatus(
          cloudOk 
            ? `Berhasil! ${vouchersData.length} voucher tersimpan ke Supabase.`
            : `Data Voucher diperbarui secara lokal. (${vouchersData.length} baris)`
        );
      }

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      setSaveStatus(`Terjadi kesalahan saat menyimpan: ${err.message || 'Error'}`);
    }
  };

  const handleDownloadTemplate = () => {
    let csvHeader = '';
    let sampleRows = '';
    let filePrefix = '';

    if (category === 'id_cards') {
      filePrefix = 'template_import_id_cards';
      csvHeader = 'id,card_code,holder_name,holder_email,area_kerja,kategori\n';
      sampleRows = 
        'IDC-001,HBD-2026-001,Budi Santoso,budi@example.com,Stage & Main Gate,Internal\n' +
        'IDC-002,HBD-2026-002,Siti Rahma,siti@example.com,Konsumsi & VIP,Internal\n' +
        'IDC-003,HBD-2026-003,Andi Wijaya,andi@example.com,Security & Parking,Internal\n';
    } else if (category === 'hari_h') {
      filePrefix = 'template_import_hari_h';
      csvHeader = 'no,group_name,pic_name,pic_phone,pagi_qty,siang_qty,malam_qty,members,notes\n';
      sampleRows = 
        '1,Booth Games Zone 3,Ahmad Farhan,082183856996,2,2,2,"Febrianesa Parengkuan, Ahmad Farhan Lubis",Pos Booth Games\n' +
        '2,Tim Stage & Audio,Rizky Pratama,081298765432,15,15,15,"Budi, Dimas, Rian, Bayu, Hendra",Backstage\n' +
        '3,Security & Parkir,Bambang,081345678901,10,10,10,"10 Petugas Shift Pagi & Malam",Main Gate\n';
    } else {
      filePrefix = 'template_import_vouchers';
      csvHeader = 'day,group_no,group_name,pic_name,pic_phone,qty,menu_vendor,members\n';
      sampleRows = 
        'H-1,1,Loading Tim Stage,Dimas,081234567890,12,Dapur Berkah HBD,"Dimas, Bayu, Rian, dkk"\n' +
        'H-1,2,Setup Tenda & Booth,Wahyu,081398765432,8,Catering Ibu Ani,"Wahyu, Arif, Dani, dkk"\n' +
        'H-2,3,Tim Runner Logistik,Fajar,081255566677,6,Sederhana Padang,"Fajar, Kiki, Rudi"\n';
    }

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filePrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" id="modal-data-import">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm">Import Data Langsung ke Supabase Database</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isCloudActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isCloudActive ? '⚡ Cloud Sync Aktif' : 'Mode Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Mendukung CSV, Excel (Copy-Paste), TSV, dan JSON. Semua baris otomatis tersimpan ke PostgreSQL Supabase.
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
          
          {/* Target Data Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Pilih Target Tabel Database:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setCategory('id_cards'); setParsedRows([]); setInputText(''); }}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                  category === 'id_cards'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${category === 'id_cards' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs">ID Card &amp; Panitia</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Tabel: <code className="font-mono">id_cards_konsumsi</code> ({currentIdCardsCount} data)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setCategory('hari_h'); setParsedRows([]); setInputText(''); }}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                  category === 'hari_h'
                    ? 'border-red-600 bg-red-50/70 text-red-950 font-bold ring-2 ring-red-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Clock className={`w-5 h-5 ${category === 'hari_h' ? 'text-red-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs">Distribusi Hari H</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Tabel: <code className="font-mono">hari_h_distributions</code> ({currentHariHCount} data)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setCategory('vouchers'); setParsedRows([]); setInputText(''); }}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                  category === 'vouchers'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Ticket className={`w-5 h-5 ${category === 'vouchers' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs">Voucher H-2 / H-1</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Tabel: <code className="font-mono">vouchers</code> ({currentVouchersCount} data)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Import Methods: Upload File or Paste Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Metode Input: Upload File atau Paste Teks Spreadsheet
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Format CSV Template</span>
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 bg-slate-50/60 transition-colors text-center relative">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSpreadsheet className="w-7 h-7 mx-auto text-slate-400 mb-1" />
              <div className="text-xs font-semibold text-slate-700">
                {fileName ? `File terpilih: ${fileName}` : 'Klik atau Drag & Drop file CSV / TSV / JSON ke sini'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Atau langsung copy-paste baris tabel dari Microsoft Excel / Google Sheets pada kotak di bawah
              </div>
            </div>

            {/* Textarea Paste */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Atau Paste Teks Tabel di Sini:
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="id,card_code,holder_name,holder_email,area_kerja,kategori&#10;IDC-001,HBD-2026-001,Budi Santoso,budi@example.com,Main Gate,Internal"
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Parse Errors */}
          {parseError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Preview Data: {parsedRows.length} baris terdeteksi
                  </span>
                </div>
                
                {/* Replace vs Merge selector */}
                <div className="flex items-center space-x-3 text-xs">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">Gabungkan (Upsert)</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">Ganti Semua</span>
                  </label>
                </div>
              </div>

              {/* Mini Preview Table */}
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      {Object.keys(parsedRows[0] || {}).slice(0, 5).map((k) => (
                        <th key={k} className="p-2 border-b">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400">{rIdx + 1}</td>
                        {Object.keys(parsedRows[0] || {}).slice(0, 5).map((k) => (
                          <td key={k} className="p-2 font-medium text-slate-800 truncate max-w-[150px]">
                            {String(row[k] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <div className="text-[10px] text-slate-400 text-center">
                  ... dan {parsedRows.length - 5} baris lainnya
                </div>
              )}
            </div>
          )}

          {/* Feedback message */}
          {saveStatus && (
            <div className={`rounded-xl p-3 text-xs font-semibold flex items-center space-x-2 ${
              saveStatus.includes('Berhasil') 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}>
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin text-blue-600' : 'text-emerald-600'}`} />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target Cloud: <strong className="text-slate-800">{isCloudActive ? 'Supabase PostgreSQL' : 'Local State'}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing || parsedRows.length === 0}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md transition-all"
            >
              <Upload className={`w-3.5 h-3.5 ${isProcessing ? 'animate-bounce' : ''}`} />
              <span>{isProcessing ? 'Menyimpan ke Cloud...' : `Import ${parsedRows.length} Data ke Supabase`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
