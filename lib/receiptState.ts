// Temporary in-memory store for receipt data between screens.
// Avoids URL param size limits for large base64 image data.

let pendingImageBase64: string | null = null;
let pendingReceiptUrl: string | null = null;
let pendingStoragePath: string | null = null;

export const receiptState = {
  set(base64: string, url: string, path: string) {
    pendingImageBase64 = base64;
    pendingReceiptUrl = url;
    pendingStoragePath = path;
  },
  getBase64: () => pendingImageBase64,
  getUrl: () => pendingReceiptUrl,
  getPath: () => pendingStoragePath,
  clear() {
    pendingImageBase64 = null;
    pendingReceiptUrl = null;
    pendingStoragePath = null;
  },
};
