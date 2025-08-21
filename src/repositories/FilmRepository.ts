import { AppDataSource } from "../AppDataSource";
import { FilmEntity } from "../entities/FilmEntity";

// ---- Types & helpers ----
export type TMDBMovie = {
    id: number;
    adult?: boolean;
    title?: string;
    original_title?: string;
    overview?: string;
    poster_path?: string | null;
    genre_ids?: number[];
    release_date?: string | null;
    vote_average?: number;
    vote_count?: number;
    popularity?: number;
};

function tmdbHeaders() {
    const token = process.env.TMDB_V4_TOKEN?.trim();
    if (!token) throw new Error("TMDB_V4_TOKEN manquant dans .env");
    return { accept: "application/json", Authorization: `Bearer ${token}` };
}

function theatricalRegions(): string[] {
    const val = process.env.TMDB_THEATRICAL_REGIONS || "BE,FR";
    return val.split(",").map(s => s.trim()).filter(Boolean);
}

function theatricalOnly(): boolean {
    return String(process.env.TMDB_THEATRICAL_ONLY || "true").toLowerCase() === "true";
}

function isNotSexual(movie: TMDBMovie): boolean {
    if (movie?.adult) return false;
    const text = `${movie?.title || ""} ${movie?.original_title || ""} ${movie?.overview || ""}`.toLowerCase();
    const banned = [
        "porn", "porno", "pornographie", "xxx",
        "sex ", " sexual", " sexe", "sexuel", "sexualité",
        "érot", "erotic", "hentai",
        "nudité", "nudity",
        "fetish", "fétich", "bdsm", "bondage",
        "striptease", "x-rated", "adult only"
    ];
    return !banned.some(k => text.includes(k));
}

function ratingThresholds() {
    const minStars = Number(process.env.MIN_RATING_STARS ?? 2); // 0..5
    const minVotes = Number(process.env.MIN_VOTE_COUNT ?? 50);
    const minAvg10 = Math.max(0, Math.min(10, (Number.isFinite(minStars) ? minStars : 2) * 2)); // /5 -> /10
    const minVotesInt = Number.isFinite(minVotes) ? Math.max(0, Math.floor(minVotes)) : 50;
    return { minAvg10, minVotes: minVotesInt };
}

function passRating(movie: TMDBMovie, th: { minAvg10: number; minVotes: number }) {
    return (movie?.vote_average ?? 0) >= th.minAvg10 && (movie?.vote_count ?? 0) >= th.minVotes;
}

// ---- Nouveau : filtre description ----
function minOverviewChars(): number {
    const n = Number(process.env.MIN_OVERVIEW_CHARS ?? 30);
    return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 30;
}

function hasOverview(movie: TMDBMovie, minChars: number): boolean {
    const ov = (movie?.overview ?? "").trim();
    return ov.length >= minChars;
}

// Construit l’URL Discover selon région + filtres communs
function buildDiscoverUrl(params: {
    page: number | string;
    region: string;
    language: string;
    minAvg10: number;
    minVotes: number;
    genres?: number[];
    providers?: number[];
    providerRegion?: string; // utiliser la même région pour watch providers
}) {
    const { page, region, language, minAvg10, minVotes, genres = [], providers = [], providerRegion } = params;

    let url =
        `https://api.themoviedb.org/3/discover/movie` +
        `?include_adult=false&include_video=false` +
        `&language=${encodeURIComponent(language)}` +
        `&region=${encodeURIComponent(region)}` +
        `&sort_by=popularity.desc` +
        `&vote_average.gte=${minAvg10}` +
        `&vote_count.gte=${minVotes}` +
        `&page=${page}`;

    // Limiter aux sorties cinéma (2 = Theatrical limited, 3 = Theatrical)
    if (theatricalOnly()) {
        url += `&with_release_type=3|2`;
    }

    if (genres.length) {
        url += `&with_genres=${genres.join(",")}`;
    }
    if (providers.length) {
        const wr = providerRegion || region;
        url += `&with_watch_providers=${providers.join(",")}&watch_region=${encodeURIComponent(wr)}`;
    }

    return url;
}

// ---- Repository ----
class FilmRepository {
    async countFilmsInDB(): Promise<number> {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        return AppDataSource.getRepository(FilmEntity).count();
    }

    async getPaginatedFilms(offset: number, limit: number): Promise<FilmEntity[]> {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        const filmRepository = AppDataSource.getRepository(FilmEntity);
        return filmRepository.find({
            skip: offset,
            take: limit,
            order: { popularity: 'DESC' }
        });
    }

    // Remplit la DB depuis TMDB (merge BE+FR si demandé) + filtres
    async getAPIFilms(page: string): Promise<void> {
        const language = process.env.TMDB_LANGUAGE || "fr-FR";
        const th = ratingThresholds();
        const minOv = minOverviewChars();

        const regions = theatricalRegions();
        const union = new Map<number, TMDBMovie>();

        for (const reg of regions) {
            const url = buildDiscoverUrl({
                page,
                region: reg,
                language,
                minAvg10: th.minAvg10,
                minVotes: th.minVotes
            });

            try {
                const res = await fetch(url, { headers: tmdbHeaders() });
                if (!res.ok) {
                    console.error(`getAPIFilms HTTP Error [${reg}]: ${res.status} - ${res.statusText}`);
                    continue;
                }
                const data = await res.json();
                const results: TMDBMovie[] = Array.isArray(data?.results) ? (data.results as TMDBMovie[]) : [];
                for (const m of results) union.set(m.id, m);
            } catch (e) {
                console.error(`Erreur Discover région ${reg} :`, e);
            }
        }

        const merged = Array.from(union.values())
            .filter((m: TMDBMovie) => isNotSexual(m))
            .filter((m: TMDBMovie) => passRating(m, th))
            .filter((m: TMDBMovie) => hasOverview(m, minOv)); // <- nouveau filtre

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(FilmEntity);

        const entities = merged.map((film: TMDBMovie) => ({
            id: film.id,
            title: film.title || 'Titre inconnu',
            overview: film.overview || 'Pas de description disponible',
            releaseDate: film.release_date ? new Date(film.release_date) : null,
            imageUrl: film.poster_path ?? null,
            genresId: Array.isArray(film.genre_ids) ? film.genre_ids.join(',') : '',
            popularity: film.popularity ?? 0,
            voteAverage: film.vote_average ?? 0,
            voteCount: film.vote_count ?? 0
        }));

        await repo.save(entities);
        console.log(`${entities.length} films enregistrés (page ${page}, régions ${regions.join("/")}).`);
    }

    // Favoris depuis TMDB (filtre ciné BE/FR + providers) + filtres
    async getFavoriteFilmsFromAPI(genreIds: number[], providerIds: number[], page: number): Promise<any[]> {
        const language = process.env.TMDB_LANGUAGE || "fr-FR";
        const th = ratingThresholds();
        const minOv = minOverviewChars();

        const regions = theatricalRegions();
        const union = new Map<number, TMDBMovie>();

        for (const reg of regions) {
            const url = buildDiscoverUrl({
                page,
                region: reg,
                language,
                minAvg10: th.minAvg10,
                minVotes: th.minVotes,
                genres: genreIds,
                providers: providerIds,
                providerRegion: reg,
            });

            try {
                const res = await fetch(url, { headers: tmdbHeaders() });
                if (!res.ok) {
                    console.error(`Favorites HTTP Error [${reg}]: ${res.status} - ${res.statusText}`);
                    continue;
                }
                const data = await res.json();
                const list: TMDBMovie[] = Array.isArray(data?.results) ? (data.results as TMDBMovie[]) : [];
                for (const m of list) union.set(m.id, m);
            } catch (e) {
                console.error(`Erreur Discover favoris région ${reg} :`, e);
            }
        }

        return Array.from(union.values())
            .filter((m: TMDBMovie) => isNotSexual(m))
            .filter((m: TMDBMovie) => passRating(m, th))
            .filter((m: TMDBMovie) => hasOverview(m, minOv)) // <- nouveau filtre
            .map((film: TMDBMovie) => ({
                id: film.id,
                title: film.title || "Titre inconnu",
                overview: film.overview || "Pas de description disponible",
                releaseDate: film.release_date || null,
                imageUrl: film.poster_path || null,
                genres: film.genre_ids || [],
                popularity: film.popularity || 0,
                voteAverage: film.vote_average || 0,
                voteCount: film.vote_count || 0
            }));

    }

    async fetchMovieDetailsFromTMDB(id: number): Promise<TMDBMovie | null> {
        const language = process.env.TMDB_LANGUAGE || "fr-FR";
        const url = `https://api.themoviedb.org/3/movie/${id}?language=${encodeURIComponent(language)}`;
        const res = await fetch(url, { headers: tmdbHeaders() });
        if (!res.ok) return null;
        return (await res.json()) as TMDBMovie;
    }

    async ensureFilmInDB(id: number): Promise<FilmEntity> {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(FilmEntity);

        let row = await repo.findOne({ where: { id } });
        if (row) return row;

        const m = await this.fetchMovieDetailsFromTMDB(id);
        row = repo.create({
            id,
            title: m?.title || m?.original_title || "Titre inconnu",
            overview: (m?.overview || "Pas de description disponible").toString(),
            releaseDate: m?.release_date ? new Date(m.release_date) : null,
            imageUrl: m?.poster_path ?? null,
            genresId: Array.isArray(m?.genre_ids) ? m!.genre_ids!.join(",") : null,
            popularity: m?.popularity ?? 0,
            voteAverage: m?.vote_average ?? 0,
            voteCount: m?.vote_count ?? 0,
        });
        return await repo.save(row);
    }
}




export default FilmRepository;
