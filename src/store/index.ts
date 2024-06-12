// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import networkStatusReducer from "./slices/networkStatusSlice";
import toolsReducer from "./slices/toolsSlice";

const store = configureStore({
  reducer: {
    networkStatus: networkStatusReducer,
    tools: toolsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
