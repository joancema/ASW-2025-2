import { TaskEntity } from "../../models/task.entity";
import { Task } from "./task";
export class TaskMapper {
    static toDomain(entity) {
        return new Task(entity.id ?? null, entity.title, entity.description, entity.isCompleted);
    }
}
//# sourceMappingURL=task.mapper.js.map