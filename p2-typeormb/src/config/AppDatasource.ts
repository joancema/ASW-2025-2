import "reflect-metadata"
import { DataSource } from "typeorm"
import { Photo } from "../models/photo"

export const AppDataSource = new DataSource({
type: "sqlite",
database: "test",
entities: [Photo],
synchronize: true,
logging: false,
})

