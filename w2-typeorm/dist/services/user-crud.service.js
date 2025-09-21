import { Task } from "../domain/task/task";
import { TaskMapper } from "../domain/task/task.mapper";
import { User } from "../domain/user/user";
import { UserMapper } from "../domain/user/user.mapper";
import { AppDataSource } from "../config/data-source";
import { TaskEntity } from "../models/task.entity";
import { UserEntity } from "../models/user.entity";
export class UserCrudService {
    constructor() {
        this.userRepo = AppDataSource.getRepository(UserEntity);
        this.taskRepo = AppDataSource.getRepository(TaskEntity);
    }
    async createUser(payload) {
        const entity = this.userRepo.create({ ...payload });
        const saved = await this.userRepo.save(entity);
        saved.tasks = [];
        return UserMapper.toDomain(saved);
    }
    async addTaskToUser(userId, payload) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ["tasks"],
        });
        if (!user) {
            throw new Error(`Usuario ${userId} no encontrado`);
        }
        const taskEntity = this.taskRepo.create({
            title: payload.title,
            description: payload.description ?? null,
            user,
        });
        const saved = await this.taskRepo.save(taskEntity);
        return TaskMapper.toDomain(saved);
    }
    async listUsers() {
        const users = await this.userRepo.find({ relations: ["tasks"] });
        return users.map(UserMapper.toDomain);
    }
    async updateTaskStatus(userId, taskId, isCompleted) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, user: { id: userId } },
            relations: ["user"],
        });
        if (!task) {
            throw new Error(`La tarea ${taskId} no pertenece al usuario ${userId}`);
        }
        task.isCompleted = isCompleted;
        const saved = await this.taskRepo.save(task);
        return TaskMapper.toDomain(saved);
    }
    async clear() {
        await this.taskRepo.delete({});
        await this.userRepo.delete({});
    }
}
//# sourceMappingURL=user-crud.service.js.map