import {PrimaryGeneratedColumn, Column, Entity, ManyToMany, JoinTable} from "typeorm";
import {ProviderEntity} from "./ProviderEntity";
import {UserEntity} from "./UserEntity";

@Entity()
export class FilmEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    title!: string

    @Column()
    overview!: string

    @Column()
    releaseDate!: Date

    @Column()
    imageUrl!: string

    @Column()
    genresId!: string

    @Column()
    popularity!: number

    @Column()
    voteAverage!: number

    @Column()
    voteCount!: number

    @ManyToMany(() => UserEntity, (user) => user.IsView)
    IsViewByUsers!: boolean

    @ManyToMany(() => UserEntity, (user) => user.likedFilms)
    likedByUsers!: UserEntity[];

    @ManyToMany(() => UserEntity, (user) => user.dislikedFilms)
    dislikedByUsers!: UserEntity[];



}