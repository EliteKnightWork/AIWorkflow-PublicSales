export const downloadCSV = (csv: string, filename: string): void => {
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csv], { type: 'text/csv' });

  const objectUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = objectUrl;

  downloadLink.click();
  downloadLink.remove();
};
