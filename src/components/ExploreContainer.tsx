import "./ExploreContainer.css";
import { useNetwork } from "../hooks/useNetwork";
import BarcodeScannerService from "../services/BarcodeScannerService";
import { startNFCScanner } from "../services/NFCScannerService";
import { useStorage } from "../providers/StorageContext";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { fetchTools, selectAllTools } from "../store/slices/toolsSlice";
import { useCallback, useEffect } from "react";

const startBarcodeScan = async () => {
  try {
    const result = await BarcodeScannerService.startBarcodeScanner();
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
  const { storageDriver } = useStorage();
  const tools = useSelector(selectAllTools);
  const dispatch = useDispatch<AppDispatch>();
  const fetchToolsCallback = useCallback(() => {
    dispatch(fetchTools());
  }, [dispatch]);

  useEffect(() => {
    fetchToolsCallback();
  }, []);

  return (
    <div id="container">
      <h1>v1</h1>
      <br />
      <strong>Network status: {isOnline ? "Online" : "Offline"}</strong>
      <br />
      <strong>Ready to scan</strong>
      <br />
      <button onClick={startBarcodeScan}>Start scan</button>
      <br />
      <button onClick={startNFCScan}>Start NFC scan</button>
      <br />
      <button onClick={updateNetworkStatus}>Log current network status</button>
      <br />
      <strong>Storage: {storageDriver}</strong>
      <br />
      <button onClick={fetchToolsCallback}>Load tools</button>
      <br />
      <strong>Tools:</strong>
      <br />
      <ul>
        {tools.map((tool) => (
          <li key={tool.id}>{tool.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default ExploreContainer;
