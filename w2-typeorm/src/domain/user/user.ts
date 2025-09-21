import { Task } from "../task/task";

export class User {
  constructor(
    public readonly id: number | null,
    public readonly name: string,
    public readonly email: string,
    public readonly tasks: Task[] = [],
  ) {}

  withTask(task: Task): User {
    return new User(this.id, this.name, this.email, [...this.tasks, task]);
  }
}
