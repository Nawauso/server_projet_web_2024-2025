import FilmRepository from '../repositories/FilmRepository';
import { FilmEntity } from "../entities/FilmEntity";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";
import { GroupFilmPriorityEntity } from "../entities/GroupFilmPriorityEntity";
import { GenreEntity } from "../entities/GenreEntity";
import { ProviderEntity } from "../entities/ProviderEntity";

class FilmService {
    private currentPage = 1;
    private pageSize = 10;

    constructor(private filmRepository: FilmRepository) {}

    // ------------------------------------------------------------
    // Pagination locale (fallback DB) — mêmes implémentations qu'avant
    // ------------------------------------------------------------
    resetPagination(): void {
        this.currentPage = 1;
        console.log("Pagination réinitialisée à la page 1.");
    }

    async getFilms(): Promise<FilmEntity[]> {
        try {
            const totalFilms = await this.filmRepository.countFilmsInDB();
            if (totalFilms === 0) {
                console.log("Aucun film trouvé dans la base. Récupération des films via l'API...");
                await this.getAPIFilms();
            }

            const offset = (this.currentPage - 1) * this.pageSize;
            const films = await this.filmRepository.getPaginatedFilms(offset, this.pageSize);

            if (films.length === 0) {
                console.log("Plus de films disponibles à afficher.");
                return [];
            }

            console.log(`Page ${this.currentPage} : ${films.length} films récupérés.`);
            this.currentPage++;
            return films;
        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération des films :", error);
            throw error;
        }
    }

    async getAPIFilms(): Promise<void> {
        for (let i = 1; i <= 100; i++) {
            try {
                await this.filmRepository.getAPIFilms(String(i));
            } catch (error) {
                console.error(`Erreur lors de l'appel de l'API pour la page ${i} :`, error);
            }
        }
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    private async resolveUserId(userId: string | number): Promise<number> {
        if (typeof userId === "number") return userId;

        const maybeNum = Number(userId);
        if (Number.isFinite(maybeNum)) return maybeNum;

        const user = await AppDataSource.getRepository(UserEntity).findOne({
            where: { email: userId },
        });
        if (!user) {
            throw new Error(`Utilisateur introuvable pour l'identifiant fourni: "${userId}"`);
        }
        return user.id;
    }

    /** Utilise les tmdbId (fallback sur id local si tmdbId null) */
    private async getUserFavorites(
        userId: number
    ): Promise<{ genres: number[]; providers: number[]; groupId: number | null }> {
        const user = await AppDataSource.getRepository(UserEntity).findOne({
            where: { id: userId },
            relations: ["selectedGenres", "selectedProviders", "group"],
        });

        const genresTmdb = (user?.selectedGenres ?? []).map(
            (g: GenreEntity) => g.tmdbId ?? g.id
        );
        const providersTmdb = (user?.selectedProviders ?? []).map(
            (p: ProviderEntity) => p.tmdbId ?? p.id
        );

        return {
            genres: genresTmdb.filter((n) => Number.isFinite(n)) as number[],
            providers: providersTmdb.filter((n) => Number.isFinite(n)) as number[],
            groupId: user?.group?.id ?? null,
        };
    }

    // ------------------------------------------------------------
    // Ancienne méthode (sans priorité de groupe) — conservée
    // ------------------------------------------------------------
    async getFavoriteFilms(userId: string | number, page: number = 1): Promise<any[]> {
        const idNum = await this.resolveUserId(userId);
        const { genres, providers } = await this.getUserFavorites(idNum);
        const films = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);
        return films;
    }

    // ------------------------------------------------------------
    // Nouvelle méthode avec priorités de groupe + fallbacks
    // ------------------------------------------------------------
    async getFavoriteFilmsWithPriority(
        userId: string | number,
        opts: { excludeIds?: number[]; limit?: number; page?: number } = {}
    ): Promise<any[]> {
        const { excludeIds = [], limit = 20, page = 1 } = opts;
        const idNum = await this.resolveUserId(userId);
        const { genres, providers, groupId } = await this.getUserFavorites(idNum);

        // 1) TMDB avec genres + providers (déjà en tmdbId)
        let list = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);

        // 2) Fallbacks si vide
        if (list.length === 0 && providers.length) {
            list = await this.filmRepository.getFavoriteFilmsFromAPI(genres, [], page);
        }
        if (list.length === 0 && genres.length) {
            list = await this.filmRepository.getFavoriteFilmsFromAPI([], [], page);
        }
        if (list.length === 0) {
            // Fallback DB local
            const dbBatch = await this.getFilms();
            list = dbBatch.map((f: FilmEntity) => ({
                id: f.id,
                title: f.title,
                overview: f.overview,
                releaseDate: f.releaseDate,
                imageUrl: f.imageUrl,
                // si FilmEntity n'a pas de relation genres, on laisse vide
                genres: (f as any).genres ?? [],
                popularity: f.popularity,
                voteAverage: f.voteAverage,
                voteCount: f.voteCount,
            }));
        }

        // Exclusions côté client
        const excl = new Set<number>(excludeIds);
        list = list.filter((m: any) => !excl.has(m.id));

        // Priorité de groupe : -1 blacklist (exclu), 0 neutre, ≥1 prioritaire
        if (groupId) {
            const repo = AppDataSource.getRepository(GroupFilmPriorityEntity);
            const ids = list.map((m: any) => m.id);
            if (ids.length) {
                const rows = await repo
                    .createQueryBuilder("gfp")
                    .where("gfp.groupId = :groupId", { groupId })
                    .andWhere("gfp.filmId IN (:...ids)", { ids })
                    .getMany();

                const pMap = new Map<number, number>();
                rows.forEach((r) => pMap.set(r.filmId, r.priority));

                // exclure -1
                list = list.filter((m: any) => (pMap.get(m.id) ?? 0) > -1);

                // tri prio desc, puis popularité/votes/id
                list.sort((a: any, b: any) => {
                    const pa = pMap.get(a.id) ?? 0;
                    const pb = pMap.get(b.id) ?? 0;
                    if (pb !== pa) return pb - pa;

                    const popB = b.popularity ?? 0;
                    const popA = a.popularity ?? 0;
                    if (popB !== popA) return popB - popA;

                    const vaB = b.voteAverage ?? 0;
                    const vaA = a.voteAverage ?? 0;
                    if (vaB !== vaA) return vaB - vaA;

                    const vcB = b.voteCount ?? 0;
                    const vcA = a.voteCount ?? 0;
                    if (vcB !== vcA) return vcB - vcA;

                    return (b.id ?? 0) - (a.id ?? 0);
                });
            }
        } else {
            list.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
        }

        return list.slice(0, Math.max(1, Math.min(100, limit)));
    }
}

export default FilmService;
