import * as icons from "ionicons/icons";
type ReturnTypeWithError<T> = T extends void
  ? Error | undefined
  : [T] | [void, Error];

type AsyncReturnTypeWithError<T> = T extends Promise<infer U>
  ? U extends void
    ? Promise<Error | undefined>
    : Promise<[U] | [void, Error]>
  : ReturnTypeWithError<T>;

type Local<T> = {
  synced: boolean;
} & T;

type ToolId = string;

type Tool = {
  id: ToolId;
  title: string;
  toolbox_id?: string;
  quantity: number;
  photo?: string;
};

type LocalTool = Local<Tool>;

type NewTool = Omit<Tool, "id">;

type LocalNewTool = Local<NewTool>;

type Toolbox = {
  id: string;
  name: string;
  tools: Tool[];
};

type LocalToolbox = Local<Toolbox>;

type Icon = (typeof icons)[keyof typeof icons];

type Action<
  T extends string | number | symbol = string,
  H extends (...args: any) => any = (...args: any) => any
> = {
  type: T;
  handler: H;
};

type createToolActionHandler = (params: Tool) => Tool;
type updateToolActionHandler = (params: Tool) => Tool;
type deleteToolActionHandler = (params: { id: ToolId }) => void;
type getToolsActionHandler = () => Tool[];

type createToolAction = Action<"createTool", createToolActionHandler>;
type updateToolAction = Action<"updateTool", updateToolActionHandler>;
type deleteToolAction = Action<"deleteTool", deleteToolActionHandler>;
type getToolsAction = Action<"getTools", getToolsActionHandler>;

type Actions = {
  getTools: getToolsAction;
  createTool: createToolAction;
  updateTool: updateToolAction;
  deleteTool: deleteToolAction;
};

type ActionType = keyof Actions;
type ActionsUnion = Actions[ActionType];

type ActionLoader<A extends Action> = (
  params: Parameters<A["handler"]>[0]
) => Promise<ReturnTypeWithError<ReturnType<A["handler"]>>>;

type createToolActionLoader = ActionLoader<createToolAction>;
type updateToolActionLoader = ActionLoader<updateToolAction>;
type deleteToolActionLoader = ActionLoader<deleteToolAction>;
type getToolsActionLoader = ActionLoader<getToolsAction>;

type ActionsLoaders = {
  getTools: getToolsActionLoader;
  createTool: createToolActionLoader;
  updateTool: updateToolActionLoader;
  deleteTool: deleteToolActionLoader;
};

export type {
  Tool,
  NewTool,
  Toolbox,
  Icon,
  Local,
  LocalTool,
  LocalNewTool,
  LocalToolbox,
  createToolAction,
  updateToolAction,
  deleteToolAction,
  getToolsAction,
  Actions,
  Action,
  ActionType,
  ReturnTypeWithError,
  AsyncReturnTypeWithError,
  ToolId,
  createToolActionHandler,
  updateToolActionHandler,
  deleteToolActionHandler,
  getToolsActionHandler,
  ActionsLoaders,
  ActionsUnion,
};
