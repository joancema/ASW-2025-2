import { Task } from './Task.js';

// Modelo puro de dominio - solo entidad sin lógica de persistencia
export class Employee {
  public id: string;
  public name: string;
  public tasks: Task[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  // Métodos de dominio (lógica de negocio pura)
  addTask(task: Task): void {
    this.tasks.push(task);
  }

  getPendingTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'pending');
  }

  getCompletedTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'completed');
  }

  // Método de dominio para actualizar nombre
  updateName(newName: string): void {
    this.name = newName;
  }
}