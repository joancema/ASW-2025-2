import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity({ name: "tasks" })
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "boolean", default: false })
  isCompleted!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.tasks, { onDelete: "CASCADE" })
  user!: UserEntity;
}
