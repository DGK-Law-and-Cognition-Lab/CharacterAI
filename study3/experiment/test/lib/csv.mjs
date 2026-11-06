// One-record CSV parsing (as written by PAVLOVIA.toCSV) and multipart/form-data parsing.

// RFC 4180: quoted fields may contain commas, quotes ("") and newlines (LF or CRLF).
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 2; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += ch; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Header + one value row -> { header: [...], record: {col: value}, nRows, duplicates: [...] }
export function csvRecord(text) {
  const rows = parseCSV(text);
  const header = rows[0] || [];
  const values = rows[1] || [];
  const record = {};
  const seen = new Set(), duplicates = [];
  header.forEach((h, i) => { if (seen.has(h)) duplicates.push(h); seen.add(h); record[h] = values[i]; });
  return { header, record, nRows: rows.length, nValues: values.length, duplicates };
}

// multipart/form-data body (Buffer) -> { fieldName: utf8 string }
export function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) return null;
  const boundary = '--' + (m[1] || m[2]).trim();
  const s = buf.toString('latin1');
  const out = {};
  for (const part of s.split(boundary)) {
    if (!part || part.startsWith('--')) continue;
    const sep = part.indexOf('\r\n\r\n');
    if (sep < 0) continue;
    const head = part.slice(0, sep);
    const name = /name="([^"]+)"/.exec(head);
    if (!name) continue;
    let body = part.slice(sep + 4);
    if (body.endsWith('\r\n')) body = body.slice(0, -2);
    out[name[1]] = Buffer.from(body, 'latin1').toString('utf8');
  }
  return out;
}
