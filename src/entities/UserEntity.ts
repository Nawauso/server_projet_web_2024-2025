import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    ManyToOne,
} from "typeorm";
import { GenreEntity } from "./GenreEntity";
import { ProviderEntity } from "./ProviderEntity";
import { GroupEntity } from "./GroupEntity";
import { FilmEntity } from "./FilmEntity";

@Entity({ name: "user_entity" })
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    firstName?: string;

    @Column({ nullable: true })
    lastName?: string;

    // Groupe (facultatif)
    @ManyToOne(() => GroupEntity, (g) => g.user, { nullable: true })
    group?: GroupEntity | null;

    // ---- Critères (propriétaire) ----
    @ManyToMany(() => GenreEntity, (genre) => genre.selectedByUsers)
    @JoinTable() // user_entity_selected_genres_genre_entity
    selectedGenres!: GenreEntity[];

    @ManyToMany(() => ProviderEntity, (provider) => provider.selectedByUsers)
    @JoinTable() // user_entity_selected_providers_provider_entity
    selectedProviders!: ProviderEntity[];

    // ---- Historique préférences films (propriétaire) ----
    @ManyToMany(() => FilmEntity, (film) => film.viewedByUsers)
    @JoinTable({ name: "user_viewed_films" })
    viewedFilms!: FilmEntity[];

    @ManyToMany(() => FilmEntity, (film) => film.likedByUsers)
    @JoinTable({ name: "user_liked_films" })
    likedFilms!: FilmEntity[];

    @ManyToMany(() => FilmEntity, (film) => film.dislikedByUsers)
    @JoinTable({ name: "user_disliked_films" })
    dislikedFilms!: FilmEntity[];
}
