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
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNzdjMmI2ODEwNDI0Zjg3MzI0NTk5YmFkOTA3YzMwZSIsIm5iZiI6MTcyOTE2ODgzMi4yNTEwMDAyLCJzdWIiOiI2NzExMDVjMDFiOTEyYWRkMmVkYmVlZTciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.z0msj7SpNTvHUVfMVCwPixfFUKEE_wAwaWBpjGqkbc0'
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

    async getFavoriteFilms(offset: number, limit: number): Promise<FilmEntity[]> {
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
}

export default FilmRepository;
