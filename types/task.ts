export type Task = {
  id: string;
  title: string;
  completed: boolean;
  bucketId: string;
  createdAt: string; // ISO string
  dueDate: string | null; // 'YYYY-MM-DD' for focus day or null for backlog
  rolledOver: boolean;
};
