/**
 * Converts a time string to strict 24h HH:mm format.
 * Only transforms known patterns; returns original string if parsing fails.
 */
export const formatTimeToHHMM = (raw: string): string => {
  if (!raw) return raw;
  const s = raw.trim();
  
  // Case 1: HH:mm:ss -> HH:mm (drop seconds)
  const mHMS = /^(\d{1,2}):(\d{2}):\d{2}$/i.exec(s);
  if (mHMS) return `${mHMS[1].padStart(2,'0')}:${mHMS[2]}`;
  
  // Case 2: 12h -> 24h (e.g., 9:05 pm)
  const m12 = /^(\d{1,2}):(\d{1,2})\s*([ap]m)$/i.exec(s);
  if (m12) {
    let [_, h, m, ap] = m12;
    let hh = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'pm') hh += 12;
    const out = `${String(hh).padStart(2,'0')}:${String(parseInt(m,10)).padStart(2,'0')}`;
    return /^((0\d|1\d|2[0-3])):([0-5]\d)$/.test(out) ? out : raw;
  }
  
  // Case 3: H:m -> HH:mm (zero-pad)
  const mHm = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  if (mHm) {
    const out = `${mHm[1].padStart(2,'0')}:${mHm[2].padStart(2,'0')}`;
    return /^((0\d|1\d|2[0-3])):([0-5]\d)$/.test(out) ? out : raw;
  }
  
  // Unknown shape: let backend validate
  return raw;
};

