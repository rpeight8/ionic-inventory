import {
  Actions,
  ActionsUnion,
  AsyncReturnTypeWithError,
  Tool,
  createToolAction,
  deleteToolAction,
  getToolsAction,
  updateToolAction,
} from "../../types";
import type { ActionSchedulerType } from "../ActionSchedulerService/ActionSchedulerService";
import {
  Status,
  RootNodeId,
} from "../ActionSchedulerService/ActionSchedulerService";
import { v4 as uuidv4 } from "uuid";

type ActionManagerType = {
  initialize: () => Promise<void>;
};

class ActionManager implements ActionManagerType {
  [key: string]: any;

  private initialized = false;

  constructor(private actionScheduler: ActionSchedulerType<ActionsUnion>) {}

  initialize: () => Promise<void> = async () => {
    if (this.initialized) return;

    try {
      await Promise.all([this.actionScheduler.initialize()]);
      this.initialized = true;
      this.actionScheduler.nodes[0].data.type;
    } catch (error) {
      console.error("Failed to initialize ActionManager", error);
      throw new Error("Failed to initialize ActionManager");
    }
  };

  getTools: () => AsyncReturnTypeWithError<Promise<Tool[]>> = async () => {
    const addNodeResult =
      await this.actionScheduler.addNodeToNode<getToolsAction>(
        {
          id: uuidv4(),
          data: {
            type: "getTools",
            payload: undefined,
            status: {
              type: Status.IDLE,
              text: "",
            },
          },
        },
        RootNodeId
      );

    if (addNodeResult.length === 2) {
      return [, addNodeResult[1]];
    }
    try {
      const tools = await addNodeResult[0];

      return [tools];
    } catch (error) {
      console.error("Failed to get tools", error);
      return [, new Error("Failed to get tools")];
    }
  };

  createTool: (tool: Tool) => AsyncReturnTypeWithError<Promise<Tool>> = async (
    tool: Tool
  ) => {
    let res, rej;
    const okPromise = new Promise<Tool>((resolve) => {
      res = resolve;
    });
    const addNodeResult = this.actionScheduler.addNodeToNode<createToolAction>({
      node: {
        id: uuidv4(),
        data: {
          type: "createTool",
          payload: tool,
          status: {
            type: Status.IDLE,
            text: "",
          },
        },
      },
      parentId: RootNodeId,
      onOk: res,
    });

    okPromise.then((tool) => console.log("Tool created", tool));

    if (addNodeResult) {
      return [, addNodeResult[1]];
    }
    try {
      const createdTool = await addNodeResult[0];

      return [createdTool];
    } catch (error) {
      console.error("Failed to create tool", error);
      return [, new Error("Failed to create tool")];
    }
  };

  updateTool: (tool: Tool) => AsyncReturnTypeWithError<Promise<Tool>> = async (
    tool: Tool
  ) => {
    const createToolNodes =
      this.actionScheduler.findByPredicate<createToolAction>(
        (action) =>
          action.data.type === "createTool" &&
          action.data.payload.id === tool.id
      );

    if (createToolNodes.length > 1) {
      return [
        ,
        new Error(`Found more than one createTool action for tool ${tool.id}`),
      ];
    }

    const toNode = createToolNodes[0].id || RootNodeId;

    const addNodeResult =
      await this.actionScheduler.addNodeToNode<updateToolAction>(
        {
          id: uuidv4(),
          data: {
            type: "updateTool",
            payload: tool,
            status: {
              type: Status.IDLE,
              text: "",
            },
          },
        },
        toNode
      );

    if (addNodeResult.length === 2) {
      return [, addNodeResult[1]];
    }
    try {
      const updatedTool = await addNodeResult[0];

      return [updatedTool];
    } catch (error) {
      console.error("Failed to update tool", error);
      return [, new Error("Failed to update tool")];
    }
  };

  deleteTool: (params: {
    id: string;
  }) => AsyncReturnTypeWithError<Promise<void>> = async (params: {
    id: string;
  }) => {
    const addNodeResult =
      await this.actionScheduler.addNodeToNode<deleteToolAction>(
        {
          id: uuidv4(),
          data: {
            type: "deleteTool",
            payload: params,
            status: {
              type: Status.IDLE,
              text: "",
            },
          },
        },
        RootNodeId
      );

    if (addNodeResult.length === 2) {
      return addNodeResult[1];
    }
    try {
      await addNodeResult[0];
      return undefined;
    } catch (error) {
      console.error("Failed to delete tool", error);
      return new Error("Failed to delete tool");
    }
  };
}

export default ActionManager;
