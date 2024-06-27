import {
  ActionsLoaders,
  AsyncReturnTypeWithError,
  Tool,
  ToolId,
} from "../../types";
import type {
  HttpClientError,
  HttpClientType,
} from "../HttpClientService/HttpClientService";
import { LocalServerConverterServiceType } from "../LocalServerConverterService";

// TODO: Make accept a generic type for action loaders
type ActionHandlersServiceType = {
  initialize: () => Promise<void>;
} & ActionsLoaders<HttpClientError>;

const isTool = (tool: unknown): tool is Tool => {
  return (
    typeof tool === "object" &&
    tool !== null &&
    "id" in tool &&
    "name" in tool &&
    "quantity" in tool
  );
};
class ActionHandlersService implements ActionHandlersServiceType {
  [key: string]: any;

  private HttpClient: HttpClientType;
  private LocalServerConverterService: LocalServerConverterServiceType<
    any,
    any
  >;
  private initialized = false;

  constructor({
    HTTPClientService,
    LocalServerConverterService,
  }: {
    HTTPClientService: HttpClientType;
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

  public createTool: (
    tool: Tool
  ) => AsyncReturnTypeWithError<Promise<Tool>, HttpClientError> = async (
    tool: Tool
  ) => {
    try {
      const result = await this.HttpClient.post("/tools", tool);

      if (result.length === 2) {
        return [, result[1]];
      }
      const createdTool = result[0];

      if (!isTool(createdTool)) {
        return [, new Error("Not a tool object")];
      }

      this.LocalServerConverterService.addLocalServerMappingEntry(
        createdTool.id,
        tool.id
      );

      return [createdTool];
    } catch (error) {
      return [, new Error("Failed to create tool")];
    }
  };

  public updateTool: (
    tool: Tool
  ) => AsyncReturnTypeWithError<Promise<Tool>, HttpClientError> = async (
    tool: Tool
  ) => {
    try {
      const result = await this.HttpClient.put(`/tools/${tool.id}`, tool);

      if (result.length === 2) {
        return [, result[1]];
      }

      const updatedTool = result[0];
      if (!isTool(updatedTool)) {
        return [, new Error("Not a tool object")];
      }

      return [updatedTool];
    } catch (error) {
      return [, new Error("Failed to update tool")];
    }
  };

  public deleteTool: (params: {
    id: ToolId;
  }) => AsyncReturnTypeWithError<Promise<void>, HttpClientError> = async ({
    id,
  }) => {
    try {
      const result = await this.HttpClient.delete(`/tools/${id}`);

      if (result.length === 2) {
        return result[1];
      }

      return;
    } catch (error) {
      return new Error("Failed to delete tool");
    }
  };

  public getTools: () => AsyncReturnTypeWithError<
    Promise<Tool[]>,
    HttpClientError
  > = async () => {
    try {
      const result = await this.HttpClient.get("/tools");

      if (result.length === 2) {
        return [, result[1]];
      }

      const tools = result[0];

      if (!Array.isArray(tools) || !tools.every(isTool)) {
        return [, new Error("Not an array of tools")];
      }

      return [tools];
    } catch (error) {
      return [, new Error("Failed to get tools")];
    }
  };
}

export default ActionHandlersService;
