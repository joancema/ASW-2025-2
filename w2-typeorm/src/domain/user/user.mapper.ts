import { UserEntity } from "../../models/user.entity";
import { TaskMapper } from "../task/task.mapper";
import { User } from "./user";

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const tasks = entity.tasks?.map(TaskMapper.toDomain) ?? [];
    return new User(entity.id ?? null, entity.name, entity.email, tasks);
  }
}
