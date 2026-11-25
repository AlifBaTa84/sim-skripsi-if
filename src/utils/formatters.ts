/**
 * Format date string (YYYY-MM-DD) to Indonesian formal uppercase format
 * e.g., "SABTU, 2-AGUSTUS-2025" or standard "Sabtu, 2 Agustus 2025"
 */
export function formatIndonesianDate(dateString: string, uppercase = false): string {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);
  
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];

  if (uppercase) {
    return `${dayName}, ${day}-${monthName}-${year}`;
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return `${capitalize(dayName)}, ${day} ${capitalize(monthName)} ${year}`;
}

/**
 * Truncate long strings neatly
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Download data as CSV file
 */
export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let stringVal = val === null || val === undefined ? '' : String(val);
      if (stringVal.search(/("|,|\n)/g) >= 0) {
        stringVal = `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

