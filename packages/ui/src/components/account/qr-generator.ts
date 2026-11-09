// QR Code Matrix Generator powered by standard RFC 18004 QRCode
import QRCode from "qrcode";

export function generateQrMatrix(text: string): boolean[][] {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        row.push(Boolean(data[r * size + c]));
      }
      matrix.push(row);
    }
    return matrix;
  } catch (err) {
    console.error("Failed to generate QR matrix:", err);
    return [];
  }
}
