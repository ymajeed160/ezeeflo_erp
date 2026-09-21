/**
 * Get a PDF preview URL from a blob.
 * Simply returns a blob URL — PDFs open best in new tabs via window.open().
 */
export async function getPdfPreviewUrl(pdfBlob) {
  return URL.createObjectURL(pdfBlob);
}
