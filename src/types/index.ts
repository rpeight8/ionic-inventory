import * as icons from "ionicons/icons";

type Tool = {
  id: string;
  title: string;
  toolbox_id: string;
  quantity: number;
};

type Toolbox = {
  id: string;
  name: string;
  tools: Tool[];
};

type IonicIcon = (typeof icons)[keyof typeof icons];

export type { Tool, Toolbox, IonicIcon };
