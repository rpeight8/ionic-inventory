import HttpClientService from "./HttpClientService";
import StorageService from "./StorageService";
// import store from "../store";
import { Tool, Toolbox } from "../types";

type DataLoaderService = {
  fetchTools: () => Promise<Tool[]>;
  createTool: (tool: Tool) => Promise<void>;
  loadToolboxes: () => Promise<Toolbox[]>;
  createToolbox: (toolbox: Toolbox) => Promise<void>;
};

const fetchTools = async (): Promise<Tool[]> => {
  try {
    let tools = await StorageService.getTools();
    try {
      tools = await HttpClientService.get<Tool[]>(
        "http://localhost:3000/tools"
      );
      await StorageService.setTools(tools);
    } catch (error) {
      console.error("Failed to fetch tools", error);
    }

    return tools;
  } catch (error) {
    console.error("Failed to load tools", error);
    throw new Error("Failed to load tools");
  }
};

const createTool = async (tool: Tool): Promise<void> => {
  try {
    await fetch("/api/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tool),
    });
  } catch (error) {
    console.error("Failed to create tool", error);
    throw new Error("Failed to create tool");
  }
};

export { fetchTools };
