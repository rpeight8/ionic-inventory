// src/redux/slices/networkStatusSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import NetworkStatusService from "../../services/NetworkStatusService";

type NetworkState = {
  isOnline: boolean;
};

const initialState: NetworkState = {
  isOnline: false,
};

const fetchNetworkStatus = createAsyncThunk<boolean, void>(
  "networkStatus/fetchStatus",
  async () => {
    const status = await NetworkStatusService.getStatus();
    return status.connected;
  }
);

const updateNetworkStatus = createAsyncThunk<void, void>(
  "networkStatus/updateStatus",
  async (_, { dispatch }) => {
    const isOnline = await dispatch(fetchNetworkStatus()).unwrap();
    dispatch(setNetworkStatus(isOnline));
  }
);

const networkStatusSlice = createSlice({
  name: "networkStatus",
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchNetworkStatus.fulfilled,
      (state, action: PayloadAction<boolean>) => {
        state.isOnline = action.payload;
      }
    );
    builder.addCase(fetchNetworkStatus.rejected, (state) => {
      state.isOnline = false;
    });
  },
});

export const { setNetworkStatus } = networkStatusSlice.actions;
export { fetchNetworkStatus, updateNetworkStatus };
export default networkStatusSlice.reducer;
