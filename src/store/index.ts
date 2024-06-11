// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import networkStatusReducer from "./slices/networkStatusSlice";

const store = configureStore({
  reducer: {
    networkStatus: networkStatusReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
