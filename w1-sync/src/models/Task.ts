export interface ITask {
  id: string;
  description: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export class Task implements ITask {
  public id: string;
  public description: string;
  public assignedTo?: string;
  public status: 'pending' | 'in_progress' | 'completed';
  public createdAt: Date;
  public completedAt?: Date;

  constructor(id: string, description: string) {
    this.id = id;
    this.description = description;
    this.status = 'pending';
    this.createdAt = new Date();
  }

  assignTo(employeeId: string): void {
    this.assignedTo = employeeId;
    this.status = 'in_progress';
  }

  markCompleted(): void {
    this.status = 'completed';
    this.completedAt = new Date();
  }
}