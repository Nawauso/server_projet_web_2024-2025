import { PrimaryGeneratedColumn, Column, Entity, OneToMany} from "typeorm";
import {UserEntity} from "./UserEntity";

@Entity()
export class GroupEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => UserEntity, (user) => user.groups)
    user!: UserEntity
}