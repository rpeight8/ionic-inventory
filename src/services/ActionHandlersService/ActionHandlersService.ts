import { s } from "vitest/dist/reporters-5f784f42";
import { ActionsHandlers, Tool } from "../../types";
import type { IHttpClient } from "../HttpClientService/HttpClientService";
import { LocalServerConverterServiceType } from "../LocalServerConverterService";

// type ActionHandlersServiceType<
//   AT extends string,
//   ART extends {
//     [key in AT]: any;
//   }
// > = {
//   performAction: <T extends AT>(action: T) => ART[T];
//   initialize: () => Promise<void>;
// };

type ActionHandlersServiceType = {
  initialize: () => Promise<void>;
} & ActionsHandlers;

class ActionHandlersService implements ActionHandlersServiceType {
  [key: string]: any;

  private HttpClient: IHttpClient;
  private LocalServerConverterService: LocalServerConverterServiceType<
    any,
    any
  >;
  private initialized = false;

  constructor({
    HTTPClientService,
    LocalServerConverterService,
  }: {
    HTTPClientService: IHttpClient;
    LocalServerConverterService: LocalServerConverterServiceType<any, any>;
  }) {
    this.HttpClient = HTTPClientService;
    this.LocalServerConverterService = LocalServerConverterService;
  }

  initialize: () => Promise<void> = async () => {
    if (this.initialized) return;

    try {
      await Promise.all([
        this.HttpClient.initialize(),
        this.LocalServerConverterService.initialize(),
      ]);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize ActionHandlersService", error);
      throw new Error("Failed to initialize ActionHandlersService");
    }
  };

  public createTool: (tool: Tool) => Promise<Tool> = async (tool: Tool) => {
    try {
      const [createdTool, err] = await this.HttpClient.post<Tool>(
        "/tools",
        tool
      );

      if (err || !createdTool) {
        throw new Error("Failed to create tool");
      }

      this.LocalServerConverterService.addLocalServerMappingEntry(
        createdTool.id,
        tool.id
      );

      return createdTool;
    } catch (error) {
      throw new Error("Failed to create tool");
    }
  };

  public updateTool: (tool: Tool) => Promise<Tool> = async (tool: Tool) => {
    try {
      const [updatedTool, err] = await this.HttpClient.put<Tool>(
        `/tools/${tool.id}`,
        tool
      );

      if (err || !updatedTool) {
        throw new Error("Failed to update tool");
      }

      return updatedTool;
    } catch (error) {
      throw new Error("Failed to update tool");
    }
  };

  public deleteTool: (tool: { id: string }) => Promise<void> = async (tool: {
    id: string;
  }) => {
    try {
      const [, err] = await this.HttpClient.delete<void>(`/tools/${tool.id}`);
      if (err) {
        throw new Error("Failed to delete tool");
      }

      await this.LocalServerConverterService.removeLocalServerMappingEntry(
        tool.id
      );
    } catch (error) {
      throw new Error("Failed to delete tool");
    }
  };

  public getTools: () => Promise<Tool[]> = async () => {
    try {
      const [tools, err] = await this.HttpClient.get<Tool[]>("/tools");
      if (err || !tools) {
        throw new Error("Failed to get tools");
      }

      return tools;
    } catch (error) {
      throw new Error("Failed to get tools");
    }
  };
}

export default ActionHandlersService;
