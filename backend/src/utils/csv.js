// Minimal, dependency-free CSV writer — donation/accounting exports are
// simple flat rows, so a full CSV library would be overkill.
function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Quote any field containing a comma, quote, or newline; double up
    // internal quotes per RFC 4180.
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(c.value(row))).join(','))
    .join('\n');

  return `${header}\n${body}`;
}

module.exports = { toCsv };
