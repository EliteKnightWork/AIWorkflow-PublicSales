export const getExtensionFromContentType = (contentType: string): string | null => {
  if (contentType.includes('pdf')) {
    return '.pdf';
  }
  if (contentType.includes('zip')) {
    return '.zip';
  }
  if (contentType.includes('text/plain')) {
    return '.txt';
  }
  if (contentType.includes('doc') || contentType.includes('msword')) {
    return '.doc';
  }
  if (
    contentType.includes('officedocument.wordprocessingml') ||
    contentType.includes('wordprocessingml.document')
  ) {
    return '.docx';
  }
  if (contentType.includes('ms-excel')) {
    return '.xls';
  }
  if (contentType.includes('spreadsheetml.sheet')) {
    return '.xlsx';
  }
  if (contentType.includes('ms-powerpoint')) {
    return '.ppt';
  }
  if (contentType.includes('presentationml.presentation')) {
    return '.pptx';
  }
  if (contentType.includes('csv')) {
    return '.csv';
  }
  return null;
};
