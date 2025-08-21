import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from "typeorm";
import { GroupEntity } from "./GroupEntity";
import { FilmEntity } from "./FilmEntity";

/**
 * Priorité d'un film pour un groupe :
 * -1 = blacklist (ne pas proposer),
 *  0 = neutre (peut être reproposé),
 *  1+ = apprécié (tri prioritaire).
 *
 * NOTE : filmId = id TMDB (tu stockes déjà l'id TMDB dans FilmEntity.id).
 */
@Entity({ name: "group_film_priority" })
@Unique(["groupId", "filmId"])
export class GroupFilmPriorityEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    groupId!: number;

    @Column()
    @Index()
    filmId!: number;

    @Column({ type: "int", default: 0 })
    priority!: number;

    @ManyToOne(() => GroupEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "groupId" })
    group!: GroupEntity;

    @ManyToOne(() => FilmEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "filmId" })
    film!: FilmEntity;
}
