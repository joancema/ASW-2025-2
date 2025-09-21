import { Task } from "../task/task";
export declare class User {
    readonly id: number | null;
    readonly name: string;
    readonly email: string;
    readonly tasks: Task[];
    constructor(id: number | null, name: string, email: string, tasks?: Task[]);
    withTask(task: Task): User;
}
//# sourceMappingURL=user.d.ts.map