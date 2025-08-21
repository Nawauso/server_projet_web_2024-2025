import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "genre_entity" })
export class GenreEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", unique: true })
    name!: string;

    @Column({ type: "int", nullable: true, unique: true })
    tmdbId!: number | null;

    @ManyToMany(() => UserEntity, (user) => user.selectedGenres)
    selectedByUsers!: UserEntity[];
}
