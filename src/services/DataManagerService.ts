import HttpClientService from "./HttpClientService";
import StorageService from "./StorageService";
// import store from "../store";
import { NewTool, Tool, Toolbox } from "../types";
import createLocalServerConverterService from "./LocalServerConverterService";
import SyncService from "./SyncService";
import { v4 as uuidv4 } from "uuid";

type LocalServerConverterService = {
  toLocal<S extends { id: string }>(entities: S[]): Promise<S[]>;
  toServer<L extends { id: string }>(entities: L[]): Promise<L[]>;
  addLocalServerMappingEntry: (
    localId: string,
    serverId: string
  ) => Promise<void>;
};

type DataManagerService = {
  fetchTools: () => Promise<Tool[]>;
  createTool: (tool: NewTool) => Promise<Tool>;
  // loadToolboxes: () => Promise<Toolbox[]>;
  createToolbox: (toolbox: Toolbox) => Promise<void>;
};

const LocalServerConverterService: LocalServerConverterService =
  createLocalServerConverterService(StorageService);

HttpClientService.setBaseUrl("http://localhost:3000");

const DataManagerService: DataManagerService = {
  fetchTools: async (): Promise<Tool[]> => {
    try {
      let tools = await StorageService.getTools();
      try {
        tools = await HttpClientService.get<Tool[]>("/tools");
        tools = await LocalServerConverterService.toLocal(tools);
        await StorageService.setTools(tools);
      } catch (error) {
        console.error("Failed to fetch tools", error);
      }

      return tools;
    } catch (error) {
      console.error("Failed to load tools", error);
      throw new Error("Failed to load tools");
    }
  },

  createTool: async (tool: NewTool): Promise<Tool> => {
    try {
      const id = uuidv4();
      const createdTool = { ...tool, id };

      await StorageService.addTool(createdTool);

      SyncService.queueTask({
        action: async () => {
          await HttpClientService.post<Tool>("/tools", {
            ...tool,
          }).then(async (response) => {
            LocalServerConverterService.addLocalServerMappingEntry(
              id,
              response.id
            );
          });
        },
        dependencies: [],
      }).catch((error: unknown) => {
        console.error("Failed to create Tool", error);
      });
      SyncService.sync();
      return createdTool;
    } catch (error) {
      console.error("Failed to create tool", error);
      throw new Error("Failed to create tool");
    }
  },

  // const loadToolboxes = async (): Promise<Toolbox[]> => {
  //   try {
  //     let toolboxes = await StorageService.getToolboxes();
  //     try {
  //       toolboxes = await HttpClientService.get<Toolbox[]>(
  //         "http://localhost:3000/toolboxes"
  //       );

  //       await StorageService.setToolboxes(toolboxes);
  //     } catch (error) {
  //       console.error("Failed to fetch toolboxes", error);
  //     }

  //     return toolboxes;
  //   } catch (error) {
  //     console.error("Failed to load toolboxes", error);
  //     throw new Error("Failed to load toolboxes");
  //   }
  // };

  createToolbox: async (toolbox: Toolbox): Promise<void> => {
    try {
      await fetch("/api/toolboxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toolbox),
      });
    } catch (error) {
      console.error("Failed to create toolbox", error);
      throw new Error("Failed to create toolbox");
    }
  },
};

export default DataManagerService;
