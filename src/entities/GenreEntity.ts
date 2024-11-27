import {PrimaryGeneratedColumn, Column, Entity, ManyToMany} from "typeorm";
import {UserEntity} from "./UserEntity";

@Entity()
export class GenreEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @ManyToMany(() => UserEntity, (user) => user.selectedGenres) // Relation inverse
    selectedByUsers!: UserEntity[];

}