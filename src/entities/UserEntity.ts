import {PrimaryGeneratedColumn, Column, Entity, ManyToOne, OneToMany, ManyToMany, JoinTable} from "typeorm";
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import {GroupEntity} from "./GroupEntity";
import {GenreEntity} from "./GenreEntity";
import {ProviderEntity} from "./ProviderEntity";
import {FilmEntity} from "./FilmEntity";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({unique: true})
    @IsNotEmpty()
    @IsEmail()
    email!: string

    @Column()
    @IsNotEmpty()
    firstName!: string

    @IsNotEmpty()
    @Column()
    lastName!: string

    @Column()
    @IsNotEmpty()
    @MinLength(10)
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