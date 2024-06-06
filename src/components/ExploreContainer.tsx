import "./ExploreContainer.css";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { useNetwork } from "../providers/NetworkContext";

interface ContainerProps {}

const startScan = async () => {
  // The camera is visible behind the WebView, so that you can customize the UI in the WebView.
  // However, this means that you have to hide all elements that should not be visible.
  // You can find an example in our demo repository.
  // In this case we set a class `barcode-scanner-active`, which then contains certain CSS rules for our app.
  document.querySelector("body")?.classList.add("barcode-scanner-active");

  // Add the `barcodeScanned` listener
  const listener = await BarcodeScanner.addListener(
    "barcodeScanned",
    async (result) => {
      console.log(result.barcode);
    }
  );

  // Start the barcode scanner
  await BarcodeScanner.startScan();
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
      <button onClick={startScan}>Start scan</button>
      <br />
      <button onClick={startNFCScan}>Start NFC scan</button>
      <br />
      <button onClick={updateNetworkStatus}>Log current network status</button>
    </div>
  );
};

export default ExploreContainer;
