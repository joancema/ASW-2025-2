import { Task } from './Task';
import { Employee } from './Employee';

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskCounter: number = 0;

  // Employee management - now async
  async addEmployee(employee: Employee): Promise<void> {
    // Since Employee.create already handles storage, we don't need to do anything here
    // The employee is already stored when created
  }

  async getEmployee(id: string): Promise<Employee | null> {
    return await Employee.findById(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await Employee.findAll();
  }

  // Task management
  createTask(description: string): Task {
    const id = `task_${++this.taskCounter}`;
    const task = new Task(id, description);
    this.tasks.set(id, task);
    return task;
  }

  async assignTask(taskId: string, employeeId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const employee = await Employee.findById(employeeId);

    if (!task || !employee) {
      return false;
    }

    task.assignTo(employeeId);
    employee.addTask(task);
    return true;
  }

  markTaskCompleted(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    task.markCompleted();
    return true;
  }

  // Verification methods
  verifyTaskCompletion(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    return task ? task.status === 'completed' : false;
  }

  getPendingTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'pending');
  }

  getInProgressTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'in_progress');
  }

  getCompletedTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === 'completed');
  }

  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    const employee = await Employee.findById(employeeId);
    return employee ? employee.tasks : [];
  }

  async getEmployeePendingTasks(employeeId: string): Promise<Task[]> {
    const employee = await Employee.findById(employeeId);
    return employee ? employee.getPendingTasks() : [];
  }

  async getEmployeeCompletedTasks(employeeId: string): Promise<Task[]> {
    const employee = await Employee.findById(employeeId);
    return employee ? employee.getCompletedTasks() : [];
  }
}