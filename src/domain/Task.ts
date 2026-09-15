export type Priority = 'baja' | 'media' | 'alta';
export type TaskStatus = 'pendiente' | 'completada';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
}
