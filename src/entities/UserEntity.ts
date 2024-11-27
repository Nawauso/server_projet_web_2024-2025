import {PrimaryGeneratedColumn, Column, Entity, ManyToOne, OneToMany, ManyToMany, JoinTable} from "typeorm";
import {GroupEntity} from "./GroupEntity";
import {GenreEntity} from "./GenreEntity";
import {ProviderEntity} from "./ProviderEntity";
import {Film} from "../models/Film";
import {FilmEntity} from "./FilmEntity";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({unique: true})
    email!: string

    @Column()
    firstName!: string

    @Column()
    lastName!: string

    @Column()
    password!: string

    @ManyToOne(() => GroupEntity, (group) => group.user)
    groups!: GroupEntity[]

    @ManyToMany(() => GenreEntity, (genre) => genre.selectedByUsers)
    @JoinTable()
    selectedGenres!: GenreEntity[];

    @ManyToMany(() => ProviderEntity, (provider) => provider.selectedByUsers)
    @JoinTable()
    selectedProviders!: ProviderEntity[];

    @ManyToMany(() => FilmEntity, (film) => film.likedByUsers)
    @JoinTable()
    likedFilms!: FilmEntity[];

    @ManyToMany(() => FilmEntity, (film) => film.dislikedByUsers)
    @JoinTable()
    dislikedFilms!: FilmEntity[];

    @ManyToMany(() => FilmEntity, (film) => film.IsViewByUsers)
    @JoinTable()
    IsView!: boolean;
}