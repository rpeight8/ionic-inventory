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

export type { Tool, Toolbox };
