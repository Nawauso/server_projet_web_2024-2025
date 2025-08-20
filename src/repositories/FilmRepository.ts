import { AppDataSource } from "../AppDataSource";
import { FilmEntity } from "../entities/FilmEntity";

// 👇 Helpers TMDB (v4) + filtre "no sex"
function tmdbHeaders() {
    const token = process.env.TMDB_V4_TOKEN?.trim();
    if (!token) throw new Error("TMDB_V4_TOKEN manquant dans .env");
    return { accept: "application/json", Authorization: `Bearer ${token}` };
}

function isNotSexual(movie: any): boolean {
    // 1) drapeau "adult" côté TMDB
    if (movie?.adult) return false;

    // 2) filtre titre/overview (FR + EN)
    const text = `${movie?.title || ""} ${movie?.original_title || ""} ${movie?.overview || ""}`
        .toLowerCase();

    const banned = [
        "porn", "porno", "pornographie", "xxx",
        "sex ", " sexual", " sexe", "sexuel", "sexualité",
        "érot", "erotic", "hentai",
        "nudité", "nudity",
        "fetish", "fétich", "bdsm", "bondage",
        "striptease", "x-rated", "x-rated", "adult only"
    ];

    return !banned.some(k => text.includes(k));
}

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

    // ✅ v4 + filtre "adult"/mots-clés
    async getAPIFilms(page: string): Promise<void> {
        const language = process.env.TMDB_LANGUAGE || "fr-FR";
        const region = process.env.TMDB_REGION || "FR";

        const url =
            `https://api.themoviedb.org/3/discover/movie` +
            `?include_adult=false&include_video=false` +
            `&language=${encodeURIComponent(language)}` +
            `&region=${encodeURIComponent(region)}` +
            `&sort_by=popularity.desc&page=${page}`;

        try {
            const res = await fetch(url, { headers: tmdbHeaders() });
            if (!res.ok) {
                console.error(`getAPIFilms HTTP Error: ${res.status} - ${res.statusText}`);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data?.results)) {
                console.error("Les résultats de l’API sont manquants ou invalides.");
                return;
            }

            // Filtrage contenu
            const cleaned = data.results.filter(isNotSexual);

            const filmRepository = AppDataSource.getRepository(FilmEntity);
            const filmEntities = cleaned.map((film: any) => ({
                id: film.id, // on utilise l'id TMDB comme PK (voir remarque entité ci-dessous)
                title: film.title || 'Titre inconnu',
                overview: film.overview || 'Pas de description disponible',
                releaseDate: film.release_date ? new Date(film.release_date) : null,
                imageUrl: film.poster_path ?? null,
                genresId: Array.isArray(film.genre_ids) ? film.genre_ids.join(',') : '',
                popularity: film.popularity ?? 0,
                voteAverage: film.vote_average ?? 0,
                voteCount: film.vote_count ?? 0
            }));

            await filmRepository.save(filmEntities);
            console.log(`${filmEntities.length} films enregistrés dans la base de données (page ${page}).`);
        } catch (error) {
            console.error('Erreur lors de la récupération des films depuis TMDB :', error);
        }
    }

    // ✅ v4 + filtre "adult"/mots-clés + favoris
    async getFavoriteFilmsFromAPI(genreIds: number[], providerIds: number[], page: number): Promise<any[]> {
        const language = process.env.TMDB_LANGUAGE || "fr-FR";
        const region = process.env.TMDB_REGION || "FR";

        const baseURL = "https://api.themoviedb.org/3/discover/movie";
        const url =
            `${baseURL}?include_adult=false&include_video=false` +
            `&language=${encodeURIComponent(language)}` +
            `&region=${encodeURIComponent(region)}` +
            `&sort_by=popularity.desc&page=${page}` +
            (genreIds.length ? `&with_genres=${genreIds.join(",")}` : "") +
            (providerIds.length ? `&with_watch_providers=${providerIds.join(",")}&watch_region=${encodeURIComponent(region)}` : "");

        try {
            const response = await fetch(url, { headers: tmdbHeaders() });

            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                if (response.status === 401) console.error("401: Vérifie TMDB_V4_TOKEN dans .env");
                return [];
            }

            const data = await response.json();
            const list = Array.isArray(data?.results) ? data.results : [];

            return list
                .filter(isNotSexual)
                .map((film: any) => ({
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
        } catch (error) {
            console.error("Erreur lors de la récupération des films favoris :", error);
            return [];
        }
    }
}

export default FilmRepository;
