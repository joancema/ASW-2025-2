import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TaskEntity } from "./task.entity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @OneToMany(() => TaskEntity, (task) => task.user, { cascade: true })
  tasks!: TaskEntity[];
}
