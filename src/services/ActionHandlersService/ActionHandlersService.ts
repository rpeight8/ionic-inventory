import { NewTool, Tool } from "../../types";
import type { IHttpClient } from "../HttpClientService/HttpClientService";

import { ILocalServerConverterService } from "../LocalServerConverterService";

interface IActionHandlersService {
  createTool: (tool: Tool) => Promise<Tool>;
  updateTool: (tool: Tool) => Promise<Tool>;
  deleteTool: (tool: Tool) => Promise<void>;
  initialize: () => Promise<void>;
}

class ActionHandlersService implements IActionHandlersService {
  private HttpClient: IHttpClient;
  private LocalServerConverterService: ILocalServerConverterService<any, any>;

  constructor({
    HTTPClientService,
    LocalServerConverterService,
  }: {
    HTTPClientService: IHttpClient;
    LocalServerConverterService: ILocalServerConverterService<any, any>;
  }) {
    this.HttpClient = HTTPClientService;
    this.LocalServerConverterService = LocalServerConverterService;
  }

  initialize: () => Promise<void> = async () => {
    await this.LocalServerConverterService.initialize();
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

  public deleteTool: (tool: Tool) => Promise<void> = async (tool: Tool) => {
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
}

export default ActionHandlersService;
export type { IActionHandlersService };
