// import "reflect-metadata"
import { DataSource } from "typeorm"
import { Mascota } from "../entities/mascota"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "test",
    entities:[Mascota],
    synchronize:true
})