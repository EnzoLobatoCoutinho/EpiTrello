export type LabelType = {
  id: number;
  board_id: number;
  name: string;
  color: string;
};

export type CardType = {
  id: number;
  list_id: number;
  label_id: number | null;
  title: string;
  description: string;
  start_date: string;
  due_date: string;
  position: number;
};

export type ListType = {
  id: number;
  board_id: number;
  title: string;
  position: number;
};