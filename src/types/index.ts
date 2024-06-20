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

export type {
  Tool,
  NewTool,
  Toolbox,
  Icon,
  Local,
  LocalTool,
  LocalNewTool,
  LocalToolbox,
};
