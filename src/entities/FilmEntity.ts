import { PrimaryColumn, Column, Entity, ManyToMany } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "film_entity" })
export class FilmEntity {
    @PrimaryColumn()
    id!: number; // id TMDB

    @Column()
    title!: string;

    @Column({ type: "text" })
    overview!: string;

    @Column({ type: "date", nullable: true })
    releaseDate!: Date | null;

    @Column({ type: "text", nullable: true })
    imageUrl!: string | null;

    // stock de secours local (si pas de M2M genre) — OK de le conserver si utilisé ailleurs
    @Column({ type: "text", nullable: true })
    genresId!: string | null;

    @Column({ type: "float", default: 0 })
    popularity!: number;

    @Column({ type: "float", default: 0 })
    voteAverage!: number;

    @Column({ type: "int", default: 0 })
    voteCount!: number;

    // Inverses des relations définies dans UserEntity (ne pas mettre @JoinTable ici)
    @ManyToMany(() => UserEntity, (user) => user.viewedFilms)
    viewedByUsers!: UserEntity[];

    @ManyToMany(() => UserEntity, (user) => user.likedFilms)
    likedByUsers!: UserEntity[];

    @ManyToMany(() => UserEntity, (user) => user.dislikedFilms)
    dislikedByUsers!: UserEntity[];
}
