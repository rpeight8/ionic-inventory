import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";

type ScanResult = {
  ScanResult: string;
};
type StartBarcodeScanner = () => Promise<ScanResult>;

const startBarcodeScanner: StartBarcodeScanner = async () => {
  return CapacitorBarcodeScanner.scanBarcode({
    hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
  });
};

export { startBarcodeScanner };
export type { ScanResult, StartBarcodeScanner };
