import * as icons from "ionicons/icons";

type Tool = {
  id: string;
  title: string;
  toolbox_id?: string;
  quantity: number;
  photo?: string;
};

type NewTool = Omit<Tool, "id">;

type Toolbox = {
  id: string;
  name: string;
  tools: Tool[];
};

type Icon = (typeof icons)[keyof typeof icons];

export type { Tool, NewTool, Toolbox, Icon };
