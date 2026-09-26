/**
 * Accurately matches two person names (e.g., card holder vs PIC or group member).
 * Avoids false positives from common single words like "Jaya", "Putra", "Ahmad", "Bella", etc.
 */
export function isPersonNameMatch(holderRaw?: string, targetRaw?: string): boolean {
  if (!holderRaw || !targetRaw) return false;

  const cleanName = (str: string) =>
    (str || '')
      .toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const h = cleanName(holderRaw);
  const t = cleanName(targetRaw);
  if (h.length < 3 || t.length < 3) return false;

  // 1. Exact match
  if (h === t) return true;

  const hWords = h.split(' ').filter((w) => w.length > 0);
  const tWords = t.split(' ').filter((w) => w.length > 0);
  if (hWords.length === 0 || tWords.length === 0) return false;

  // 2. Full phrase containment (e.g. "kokoh jaya" in "kokoh jaya adillah", or "vito kumala" in "el vito kumala")
  // Only valid if the substring has at least 2 significant words or is >= 6 chars
  if ((hWords.length >= 2 || h.length >= 6) && t.includes(h)) return true;
  if ((tWords.length >= 2 || t.length >= 6) && h.includes(t)) return true;

  // 3. Significant words comparison (excluding single-character initials like 'a', 'm', 's')
  const hSig = hWords.filter((w) => w.length >= 2);
  const tSig = tWords.filter((w) => w.length >= 2);

  // If both have at least 2 significant words
  if (hSig.length >= 2 && tSig.length >= 2) {
    // Both first two words match! E.g. "kokoh jaya a" vs "kokoh jaya adillah"
    if (hSig[0] === tSig[0] && hSig[1] === tSig[1]) {
      return true;
    }
    // Both words in a 2-word input exist in target (e.g. "el vito" or "vito kumala" in "el vito kumala")
    if (hSig.length === 2 && tSig.includes(hSig[0]) && tSig.includes(hSig[1])) {
      return true;
    }
  }

  // 4. Single-word name (e.g. holder typed "Vito" or "Fadlillah" or "Indah")
  // Only match if the single word is significant (>= 4 chars) and exists as a distinct word in target
  // and is NOT a common generic word like "panitia", "bapak", "ibu", "zone", "team"
  const genericWords = ['panitia', 'bapak', 'bunda', 'putra', 'putri', 'zone', 'team', 'crew', 'staff', 'admin'];
  if (hSig.length === 1 && hSig[0].length >= 4 && !genericWords.includes(hSig[0])) {
    const single = hSig[0];
    // If target starts with this word (e.g. "fadlillah" in "fadlillah azhar")
    if (tSig[0] === single) {
      return true;
    }
    // Or if target contains this word and word length >= 4 (e.g. "vito" in "el vito kumala")
    if (tSig.includes(single)) {
      return true;
    }
  }

  return false;
}
