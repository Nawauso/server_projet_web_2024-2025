import GenreRepository from '../repositories/GenreRepository';
import { Genre } from '../models/Genre';

class GenreService {
    private genreRepository: GenreRepository;

    constructor(genreRepository: GenreRepository) {
        this.genreRepository = genreRepository;
    }

    async getGenres(): Promise<Genre[]> {
        const genres = await this.genreRepository.getGenres();
        if (!genres.length) {
            throw new Error('Genres not found');
        }
        return genres;
    }
}

export default GenreService;
