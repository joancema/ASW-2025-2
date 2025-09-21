import { Task } from "../domain/task/task";
import { User } from "../domain/user/user";
type CreateUserInput = {
    name: string;
    email: string;
};
type CreateTaskInput = {
    title: string;
    description?: string | null;
};
export declare class UserCrudService {
    private readonly userRepo;
    private readonly taskRepo;
    createUser(payload: CreateUserInput): Promise<User>;
    addTaskToUser(userId: number, payload: CreateTaskInput): Promise<Task>;
    listUsers(): Promise<User[]>;
    updateTaskStatus(userId: number, taskId: number, isCompleted: boolean): Promise<Task>;
    clear(): Promise<void>;
}
export {};
//# sourceMappingURL=user-crud.service.d.ts.map