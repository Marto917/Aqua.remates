import QRCode from "qrcode";

export async function generateShippingQrDataUrl(payloadJson: string): Promise<string> {
  return QRCode.toDataURL(payloadJson, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
