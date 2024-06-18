// src/redux/slices/networkStatusSlice.ts
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AsyncThunk,
  SerializedError,
} from "@reduxjs/toolkit";
import DataManagerService from "../../services/DataManagerService";
import { NewTool, Tool } from "../../types";

type ToolsState = {
  tools: Tool[];
  status: string;
  error?: SerializedError;
};

const initialState: ToolsState = {
  tools: [],
  status: "idle",
  error: undefined,
};

const fetchTools = createAsyncThunk<Tool[], void>(
  "tools/fetchTools",
  async () => {
    const tools = await DataManagerService.fetchTools();
    return tools;
  }
);

const createTool = createAsyncThunk<Tool, NewTool>(
  "tools/createTool",
  async (tool: NewTool) => {
    const newTool = await DataManagerService.createTool(tool);
    return newTool;
  }
);

const setTools = (state: ToolsState, action: PayloadAction<Tool[]>) => {
  state.tools = action.payload;
};

const toolsSlice = createSlice({
  name: "tools",
  initialState,
  reducers: {
    setTools,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTools.pending, (state) => {
      state.status = "loading";
      state.error = undefined;
    });
    builder.addCase(
      fetchTools.fulfilled,
      (state, action: PayloadAction<Tool[]>) => {
        state.status = "succeeded";
        state.error = undefined;
        state.tools = action.payload;
      }
    );
    builder.addCase(fetchTools.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.error;
    });
    builder.addCase(createTool.pending, (state) => {
      state.status = "loading";
      state.error = undefined;
    });
    builder.addCase(
      createTool.fulfilled,
      (state, action: PayloadAction<Tool>) => {
        state.status = "succeeded";
        state.error = undefined;
        state.tools.push(action.payload);
      }
    );
    builder.addCase(createTool.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.error;
    });
  },
});

const selectAllTools = (state: { tools: ToolsState }) => state.tools.tools;

export { fetchTools, createTool, selectAllTools };
export default toolsSlice.reducer;
