import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Pet {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    @Column()
    name: string
    @Column()
    age: number;
    @Column()
    breed: string;
}
