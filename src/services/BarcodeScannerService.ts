import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";

type ScanResult = {
  ScanResult: string;
};
type StartBarcodeScanner = () => Promise<ScanResult>;
type BarcodeScannerService = {
  startBarcodeScanner: StartBarcodeScanner;
};

const BarcodeScannerService: BarcodeScannerService = {
  startBarcodeScanner: async () => {
    return CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
    });
  },
};

export default BarcodeScannerService;
export type { BarcodeScannerService };
