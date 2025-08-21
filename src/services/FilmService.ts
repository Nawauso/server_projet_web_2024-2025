import FilmRepository from '../repositories/FilmRepository';
import { FilmEntity } from "../entities/FilmEntity";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";
import { GroupFilmPriorityEntity } from "../entities/GroupFilmPriorityEntity";
import { GenreEntity } from "../entities/GenreEntity";
import { ProviderEntity } from "../entities/ProviderEntity";
import { In, MoreThan } from "typeorm";

type HomeCursor = {
    a: number; // index segment A (prio)
    b: number; // index segment B (filtres groupe)
    c: number; // réservé (si besoin)
    dOffset: number; // offset segment D (défaut DB)
    noticeSent?: boolean;
};

function encodeCursor(c: HomeCursor): string {
    return Buffer.from(JSON.stringify(c), "utf8").toString("base64");
}
function decodeCursor(s?: string): HomeCursor {
    if (!s) return { a: 0, b: 0, c: 0, dOffset: 0, noticeSent: false };
    try { return JSON.parse(Buffer.from(s, "base64").toString("utf8")) as HomeCursor; }
    catch { return { a: 0, b: 0, c: 0, dOffset: 0, noticeSent: false }; }
}

function filmMatchesGenresCSV(csv: string | null, wanted: Set<number>): boolean {
    if (!csv || !wanted.size) return false;
    const arr = csv.split(",").map(s => Number(s.trim())).filter(Number.isFinite);
    return arr.some(id => wanted.has(id));
}

export default class FilmService {
    private currentPage = 1;
    private pageSize = 10;

    constructor(private filmRepository: FilmRepository) {}

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
            if (films.length === 0) return [];
            this.currentPage++;
            return films;
        } catch (error) {
            console.error("Erreur getFilms:", error);
            throw error;
        }
    }

    async getAPIFilms(): Promise<void> {
        for (let i = 1; i <= 100; i++) {
            try { await this.filmRepository.getAPIFilms(String(i)); }
            catch (error) { console.error(`Erreur API page ${i}:`, error); }
        }
    }

    private async resolveUserId(userId: string | number): Promise<number> {
        if (typeof userId === "number") return userId;
        const maybeNum = Number(userId);
        if (Number.isFinite(maybeNum)) return maybeNum;
        const user = await AppDataSource.getRepository(UserEntity).findOne({ where: { email: userId } });
        if (!user) throw new Error(`Utilisateur introuvable: "${userId}"`);
        return user.id;
    }

    private async getUserFavorites(userId: number): Promise<{ genres: number[]; providers: number[]; groupId: number | null }> {
        const user = await AppDataSource.getRepository(UserEntity).findOne({
            where: { id: userId },
            relations: ["selectedGenres", "selectedProviders", "group"],
        });

        const genresTmdb = (user?.selectedGenres ?? []).map((g: GenreEntity) => g.tmdbId ?? g.id);
        const providersTmdb = (user?.selectedProviders ?? []).map((p: ProviderEntity) => p.tmdbId ?? p.id);

        return {
            genres: genresTmdb.filter(n => Number.isFinite(n)) as number[],
            providers: providersTmdb.filter(n => Number.isFinite(n)) as number[],
            groupId: user?.group?.id ?? null,
        };
    }

    async getFavoriteFilms(userId: string | number, page: number = 1): Promise<any[]> {
        const idNum = await this.resolveUserId(userId);
        const { genres, providers } = await this.getUserFavorites(idNum);
        const films = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);
        return films;
    }

    async getFavoriteFilmsWithPriority(
        userId: string | number,
        opts: { excludeIds?: number[]; limit?: number; page?: number } = {}
    ): Promise<any[]> {
        const { excludeIds = [], limit = 20, page = 1 } = opts;
        const idNum = await this.resolveUserId(userId);
        const { genres, providers, groupId } = await this.getUserFavorites(idNum);

        let list = await this.filmRepository.getFavoriteFilmsFromAPI(genres, providers, page);
        if (list.length === 0 && providers.length) list = await this.filmRepository.getFavoriteFilmsFromAPI(genres, [], page);
        if (list.length === 0 && genres.length) list = await this.filmRepository.getFavoriteFilmsFromAPI([], [], page);
        if (list.length === 0) {
            const dbBatch = await this.getFilms();
            list = dbBatch.map((f: FilmEntity) => ({
                id: f.id, title: f.title, overview: f.overview, releaseDate: f.releaseDate, imageUrl: f.imageUrl,
                genres: (f as any).genres ?? [], popularity: f.popularity, voteAverage: f.voteAverage, voteCount: f.voteCount,
            }));
        }

        const excl = new Set<number>(excludeIds);
        list = list.filter((m: any) => !excl.has(m.id));

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
                rows.forEach(r => pMap.set(r.filmId, r.priority));

                list = list.filter((m: any) => (pMap.get(m.id) ?? 0) > -1);
                list.sort((a: any, b: any) => {
                    const pa = pMap.get(a.id) ?? 0, pb = pMap.get(b.id) ?? 0;
                    if (pb !== pa) return pb - pa;
                    const popB = b.popularity ?? 0, popA = a.popularity ?? 0;
                    if (popB !== popA) return popB - popA;
                    const vaB = b.voteAverage ?? 0, vaA = a.voteAverage ?? 0;
                    if (vaB !== vaA) return vaB - vaA;
                    const vcB = b.voteCount ?? 0, vcA = a.voteCount ?? 0;
                    if (vcB !== vcA) return vcB - vcA;
                    return (b.id ?? 0) - (a.id ?? 0);
                });
            }
        } else {
            list.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
        }

        return list.slice(0, Math.max(1, Math.min(100, limit)));
    }

    // ---------- NOUVEAU : flux HOME trié ----------
    async getHomeFeed(userId: number, opts: { limit?: number; cursor?: string } = {}) {
        const limit = Math.max(1, Math.min(40, opts.limit || 20));
        const cur = decodeCursor(opts.cursor);

        // ✅ Fallback: si la DB est vide, on seed depuis TMDB
        const count = await this.filmRepository.countFilmsInDB();
        if (count === 0) {
            console.log("[home] DB vide → seed TMDB");
            await this.getAPIFilms();
        }

        const userRepo = AppDataSource.getRepository(UserEntity);
        const filmRepo = AppDataSource.getRepository(FilmEntity);
        const gfpRepo  = AppDataSource.getRepository(GroupFilmPriorityEntity);

        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ["group", "likedFilms", "dislikedFilms"],
        });

        const dislikedSet = new Set<number>(user?.dislikedFilms?.map(f => f.id) ?? []);

        // --- A) Prioritaires
        let prioList: FilmEntity[] = [];
        if (user?.group?.id) {
            // on récupère prio > 0 et on exclut ceux à -1 (blacklist)
            const rows = await gfpRepo
                .createQueryBuilder("g")
                .innerJoin(FilmEntity, "f", "f.id = g.filmId")
                .where("g.groupId = :gid", { gid: user.group.id })
                .andWhere("g.priority > 0")                       // 👉 > 0
                .orderBy("g.priority", "DESC")
                .addOrderBy("f.popularity", "DESC")
                .select(["f.id AS id"])
                .getRawMany<{ id: number }>();

            const ids = rows.map(r => r.id);
            if (ids.length) {
                const films = await filmRepo.find({ where: { id: In(ids) } });
                const byId = new Map(films.map(f => [f.id, f]));
                prioList = ids.map(id => byId.get(id)).filter((x): x is FilmEntity => !!x);
            }
        } else {
            prioList = (user?.likedFilms ?? []).slice().sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        }
        prioList = prioList.filter(f => !dislikedSet.has(f.id));

        // --- B) Filtres groupe (genres agrégés)
        let filtList: FilmEntity[] = [];
        let groupNotice = false;

        if (user?.group?.id) {
            const members = await userRepo.find({ where: { group: { id: user.group.id } }, relations: ["selectedGenres"] });
            const wantedGenres = new Set<number>();
            for (const m of members) (m.selectedGenres ?? []).forEach(g => wantedGenres.add(g.tmdbId ?? g.id));

            // Exclusion explicite des films blacklistés (priority = -1) pour le groupe
            const blackRows = await gfpRepo.find({ where: { groupId: user.group.id, priority: -1 } });
            const blackSet = new Set<number>(blackRows.map(r => r.filmId));

            if (wantedGenres.size) {
                const pool = await filmRepo.find({ order: { popularity: "DESC" }, take: 500, skip: 0 });
                filtList = pool
                    .filter(f => filmMatchesGenresCSV(f.genresId, wantedGenres))
                    .filter(f => !dislikedSet.has(f.id))
                    .filter(f => !blackSet.has(f.id)); // 👉 exclure blacklist groupe
            }
        }

        // --- C) Défaut (toujours dispo)
        const defaultBatch = await this.filmRepository.getPaginatedFilms(cur.dOffset, limit * 2);
        const defaultList = defaultBatch.filter(f => !dislikedSet.has(f.id));
        // Assemblage par segments avec curseur
        const out: FilmEntity[] = [];
        let { a, b, dOffset, noticeSent } = cur;

        // 1) Prioritaires
        while (out.length < limit && a < prioList.length) {
            out.push(prioList[a++]);
        }

        // 2) Filtres groupe
        while (out.length < limit && b < filtList.length) {
            out.push(filtList[b++]);
        }
        if (!noticeSent && user?.group?.id && b >= filtList.length) {
            groupNotice = true; // première fois qu’on épuise les filtres groupe
            noticeSent = true;
        }

        // 3) Défaut
        let dIdx = 0;
        while (out.length < limit && dIdx < defaultList.length) {
            out.push(defaultList[dIdx++]);
            dOffset++;
        }

        const nextCursor =
            out.length === 0
                ? null
                : encodeCursor({ a, b, c: 0, dOffset, noticeSent });

        return {
            items: out,
            nextCursor,
            notice: groupNotice ? "Plus de films dans les catégories sélectionnées – affichage des films par défaut." : undefined,
        };
    }
}
