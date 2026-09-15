import type { Task } from '../domain/Task';

export interface TaskRepository {
  getAll(): Task[];
  saveAll(tasks: Task[]): void;
}