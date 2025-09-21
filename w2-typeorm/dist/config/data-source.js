import { DataSource } from "typeorm";
import { TaskEntity } from "../models/task.entity";
import { UserEntity } from "../models/user.entity";
export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true, // Auto-sync solo para desarrollo
    logging: false,
    entities: [UserEntity, TaskEntity],
});
//# sourceMappingURL=data-source.js.map