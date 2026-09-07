function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function mapRow(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[snakeToCamel(key)] = value;
  }
  return out;
}

export function mapRows(rows) {
  return rows.map(mapRow);
}
