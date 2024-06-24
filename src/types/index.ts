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

type ActionType = "createTool" | "updateTool" | "deleteTool";

// Define a type for the return values. Adjust this type according to your needs.
type ActionReturnType = {
  createTool: Promise<Tool>;
  updateTool: Promise<Tool>;
  deleteTool: Promise<void>;
};

// Define the Actions type with restrictions on return type
type Actions = {
  [key in ActionType]: () => ActionReturnType[key];
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
  ActionType,
  ActionReturnType,
  Actions,
};
