import {AppDataSource} from "../AppDataSource";
import {FilmEntity} from "../entities/FilmEntity";

class FilmRepository {
    async countFilmsInDB(): Promise<number> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const filmRepository = AppDataSource.getRepository(FilmEntity);
        return await filmRepository.count(); // Retourne le nombre total de films dans la DB
    }

    async getPaginatedFilms(offset: number, limit: number): Promise<FilmEntity[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const filmRepository = AppDataSource.getRepository(FilmEntity);
        return await filmRepository.find({
            skip: offset,
            take: limit,
            order: {
                popularity: 'DESC' // Optionnel : tri par popularité
            }
        });
    }

    async getAPIFilms(path: string): Promise<void> {
        const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=fr-BE&sort_by=popularity.desc&page=${path}`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: " Bearer " + process.env.TMDB_TOKEN
            }
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                console.error(`getAPIFilms HTTP Error: ${response.status} - ${response.statusText}`);
                return;
            }

            const filmRepository = AppDataSource.getRepository(FilmEntity);
            const data = await response.json();

            if (data.results && Array.isArray(data.results)) {
                const filmEntities = data.results.map((film: any) => ({
                    id: film.id,
                    title: film.title || 'Titre inconnu',
                    overview: film.overview || 'Pas de description disponible',
                    releaseDate: film.release_date ? new Date(film.release_date) : null,
                    imageUrl: film.poster_path ? film.poster_path : null,
                    genresId: film.genre_ids ? film.genre_ids.join(',') : '',
                    popularity: film.popularity || 0,
                    voteAverage: film.vote_average || 0,
                    voteCount: film.vote_count || 0
                }));

                await filmRepository.save(filmEntities);
                console.log(`${filmEntities.length} films enregistrés dans la base de données.`);
            } else {
                console.error('Les résultats de l’API sont manquants ou invalides.');
            }
        } catch (error) {
            console.error('Une erreur s’est produite lors de la récupération des films depuis l’API :', error);
        }
    }

    async getFavoriteFilmsFromAPI(genreIds: number[], providerIds: number[], page: number): Promise<any[]> {
        const apiKey = process.env.TMDB_TOKEN;
        if (!apiKey) {
            console.error("Erreur : TMDB_API_KEY manquant dans les variables d'environnement.");
            return [];
        }

        // Construire l'URL manuellement avec concaténation
        const baseURL = "https://api.themoviedb.org/3/discover/movie";
        const url = `${baseURL}?include_adult=false&include_video=false&language=fr-BE&sort_by=popularity.desc&page=${page}` +
            `&with_genres=${genreIds.join(",")}&with_watch_providers=${providerIds.join(",")}&watch_region=BE`;

        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${apiKey}`
            }
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                if (response.status === 401) {
                    console.error("Erreur 401 : Vérifiez que la clé API est correcte et valide.");
                }
                return [];
            }

            const data = await response.json();
            return data.results.map((film: any) => ({
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
            console.error("Une erreur s'est produite lors de la récupération des films favoris :", error);
            return [];
        }
    }


}

export default FilmRepository;
