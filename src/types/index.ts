import * as icons from "ionicons/icons";

type Local<T> = {
  synced: boolean;
} & T;

type Tool = {
  id: string;
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

type createToolAction = (params: Tool) => Promise<Tool>;
type updateToolAction = (params: Tool) => Promise<Tool>;
type deleteToolAction = (params: { id: string }) => Promise<void>;
type getToolsAction = () => Promise<Tool[]>;

type ActionsHandlers = {
  getTools: getToolsAction;
  createTool: createToolAction;
  updateTool: updateToolAction;
  deleteTool: deleteToolAction;
};

type ActionType = keyof ActionsHandlers;

// Define a type for the return values. Adjust this type according to your needs.

// Define the Actions type with restrictions on return type

export type {
  Tool,
  NewTool,
  Toolbox,
  Icon,
  Local,
  LocalTool,
  LocalNewTool,
  LocalToolbox,
  ActionType,
  ActionsHandlers,
};
