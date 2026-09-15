import type { Task } from '../domain/Task';
import type { TaskRepository } from './TaskRepository';

export class LocalStorageRepository implements TaskRepository {
  private readonly STORAGE_KEY = 'todo_app_tasks';

  getAll(): Task[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveAll(tasks: Task[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }
}