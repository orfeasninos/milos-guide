// Client-safe matching shared by the /search/ page and the header search box.

export interface SearchItem {
  type: string;
  typeEl: string;
  typeEn: string;
  nameEl: string;
  nameEn: string;
  area: string;
  url: string;
  icon: string;
}

// Case-, accent- and final-sigma-insensitive, so "plaka" or "πλακα" finds "Πλάκα".
// Folds one character at a time so positions still line up with the original text.
export const foldChar = (ch: string) => ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ς/g, 'σ');
export const fold = (text: string) => [...text].map(foldChar).join('');

// `q` must already be folded.
export const matches = (item: SearchItem, q: string) =>
  fold(item.nameEl).includes(q) ||
  fold(item.nameEn).includes(q) ||
  fold(item.area).includes(q) ||
  fold(item.typeEn).includes(q);

export function highlight(text: string, q: string) {
  if (!q) return text;
  const chars = [...text];
  const folded = chars.map(foldChar);
  // Only a 1:1 fold keeps indexes aligned; otherwise skip the highlight rather than mark the wrong letters.
  if (folded.some(f => f.length !== 1)) return text;
  const start = folded.join('').indexOf(q);
  if (start < 0) return text;
  const end = start + [...q].length;
  return chars.slice(0, start).join('') + '<mark>' + chars.slice(start, end).join('') + '</mark>' + chars.slice(end).join('');
}
