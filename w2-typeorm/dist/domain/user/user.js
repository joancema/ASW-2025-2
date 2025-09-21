import { Task } from "../task/task";
export class User {
    constructor(id, name, email, tasks = []) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.tasks = tasks;
    }
    withTask(task) {
        return new User(this.id, this.name, this.email, [...this.tasks, task]);
    }
}
//# sourceMappingURL=user.js.map