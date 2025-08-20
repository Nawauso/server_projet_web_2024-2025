import { PrimaryColumn, Column, Entity, ManyToMany } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity()
export class FilmEntity {
    @PrimaryColumn()
    id!: number; // id TMDB

    @Column()
    title!: string;

    @Column({ type: 'text' })
    overview!: string;

    @Column({ type: 'date', nullable: true })
    releaseDate!: Date | null;

    @Column({ type: 'text', nullable: true })
    imageUrl!: string | null;

    @Column({ type: 'text', nullable: true })
    genresId!: string | null;

    @Column({ type: 'float', default: 0 })
    popularity!: number;

    @Column({ type: 'float', default: 0 })
    voteAverage!: number;

    @Column({ type: 'int', default: 0 })
    voteCount!: number;

    @ManyToMany(() => UserEntity, (user) => user.IsView)
    IsViewByUsers!: UserEntity[];

    @ManyToMany(() => UserEntity, (user) => user.likedFilms)
    likedByUsers!: UserEntity[];

    @ManyToMany(() => UserEntity, (user) => user.dislikedFilms)
    dislikedByUsers!: UserEntity[];
}
