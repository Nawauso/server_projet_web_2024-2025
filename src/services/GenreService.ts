import GenreRepository from '../repositories/GenreRepository';
import { Genre } from '../models/Genre';

class GenreService {
    private genreRepository: GenreRepository;

    constructor(genreRepository: GenreRepository) {
        this.genreRepository = genreRepository;
    }

    getGenres(): Genre[] {
        const genres = this.genreRepository.getGenres();
        if (!genres) {
            throw new Error('Genres not found');
        }
        return genres;
    }
}

export default GenreService;
