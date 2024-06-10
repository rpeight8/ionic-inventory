import "./ExploreContainer.css";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { useNetwork } from "../providers/NetworkContext";
import { startBarcodeScanner } from "../services/BarcodeScanner";

interface ContainerProps {}

const startScan = async () => {
  try {
    const result = await startBarcodeScanner();
    console.log(result);
  } catch (error) {
    console.error("An error occurred while scanning QR-Code:", error);
  }
};

const startNFCScan = async () => {
  throw new Error("Not implemented");
};

const ExploreContainer: React.FC<ContainerProps> = () => {
  const { isOnline, updateNetworkStatus } = useNetwork();

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
    </div>
  );
};

export default ExploreContainer;
