import { AppDataSource } from "../AppDataSource";
import { GenreEntity } from "../entities/GenreEntity";
import { Genre } from "../models/Genre";

class GenreRepository {
    private genreRepository = AppDataSource.getRepository(GenreEntity);

    async getGenres(): Promise<Genre[]> {
        const genres = await this.genreRepository.find(); // Récupère toutes les données dans la table Genre
        return genres.map(genreEntity => new Genre(genreEntity.id, genreEntity.name));
    }
}

export default GenreRepository;
