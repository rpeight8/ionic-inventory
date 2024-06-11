// src/hooks/useNetwork.ts
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useCallback } from "react";
import {
  fetchNetworkStatus,
  updateNetworkStatus,
} from "../store/slices/networkStatusSlice";
import NetworkStatusService from "../services/NetworkStatusService";
import { RootState, AppDispatch } from "../store";

export const useNetwork = () => {
  const dispatch: AppDispatch = useDispatch();
  const isOnline = useSelector(
    (state: RootState) => state.networkStatus.isOnline
  );

  const handleNetworkStatusChange = useCallback(async () => {
    await dispatch(updateNetworkStatus());
  }, [dispatch]);

  useEffect(() => {
    NetworkStatusService.addListener(
      "networkStatusChange",
      handleNetworkStatusChange
    );

    handleNetworkStatusChange();

    return () => {
      NetworkStatusService.removeAllListeners();
    };
  }, [handleNetworkStatusChange]);

  return { isOnline, updateNetworkStatus: handleNetworkStatusChange };
};
