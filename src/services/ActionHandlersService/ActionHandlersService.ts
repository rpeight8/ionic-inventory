import { s } from "vitest/dist/reporters-5f784f42";
import {
  ActionType,
  Actions,
  ActionsLoaders,
  AsyncReturnTypeWithError,
  Tool,
  ToolId,
} from "../../types";
import type { IHttpClient } from "../HttpClientService/HttpClientService";
import { LocalServerConverterServiceType } from "../LocalServerConverterService";

type ActionHandlersServiceType = {
  initialize: () => Promise<void>;
};

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

  public createTool: (tool: Tool) => AsyncReturnTypeWithError<Promise<Tool>> =
    async (tool: Tool) => {
      try {
        const result = await this.HttpClient.post<Tool>("/tools", tool);

        if (result.length === 2) {
          return [, result[1]];
        }
        const createdTool = result[0];

        this.LocalServerConverterService.addLocalServerMappingEntry(
          createdTool.id,
          tool.id
        );

        return [createdTool];
      } catch (error) {
        throw new Error("Failed to create tool");
      }
    };

  public updateTool: (tool: Tool) => AsyncReturnTypeWithError<Promise<Tool>> =
    async (tool: Tool) => {
      try {
        const result = await this.HttpClient.put<Tool>(
          `/tools/${tool.id}`,
          tool
        );

        if (result.length === 2) {
          return [, result[1]];
        }

        return [result[0]];
      } catch (error) {
        throw new Error("Failed to update tool");
      }
    };

  public deleteTool: (params: {
    id: ToolId;
  }) => AsyncReturnTypeWithError<Promise<void>> = async ({ id }) => {
    try {
      const result = await this.HttpClient.delete<void>(`/tools/${id}`);

      if (result.length === 2) {
        return result[1];
      }

      return;
    } catch (error) {
      return new Error("Failed to delete tool");
    }
  };

  public getTools: () => AsyncReturnTypeWithError<Promise<Tool[]>> =
    async () => {
      try {
        const result = await this.HttpClient.get<Tool[]>("/tools");

        if (result.length === 2) {
          return [, result[1]];
        }

        return [result[0]];
      } catch (error) {
        throw new Error("Failed to get tools");
      }
    };
}

export default ActionHandlersService;
