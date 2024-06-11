import "./ExploreContainer.css";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { useNetwork } from "../providers/NetworkContext";
import { startBarcodeScanner } from "../services/BarcodeScanner";
import { startNFCScanner } from "../services/NFCScanner";
import { useStorage } from "../providers/StorageContext";

const startScan = async () => {
  try {
    const result = await startBarcodeScanner();
    console.log(result);
  } catch (error) {
    console.error("An error occurred while scanning QR-Code:", error);
  }
};

const startNFCScan = async () => {
  try {
    const result = await startNFCScanner();
    console.log(result);
  } catch (error) {
    console.error("An error occurred while scanning NFC:", error);
  }
};

const ExploreContainer: React.FC<{}> = () => {
  const { isOnline, updateNetworkStatus } = useNetwork();
  const { storageReady, storageDriver } = useStorage();

  return (
    <div id="container">
      <strong>Network status: {isOnline ? "Online" : "Offline"}</strong>
      <br />
      <strong>Ready to scan</strong>
      <br />
      <button onClick={startScan}>Start scan</button>
      <br />
      <button onClick={startNFCScan}>Start NFC scan</button>
      <br />
      <button onClick={updateNetworkStatus}>Log current network status</button>
      <br />
      <strong>Storage: {storageDriver}</strong>
    </div>
  );
};

export default ExploreContainer;
