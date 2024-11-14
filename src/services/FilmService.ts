import FilmRepository from '../repositories/FilmRepository';
import { Film } from '../models/Film';

class FilmService {
    private filmRepository: FilmRepository;

    constructor(filmRepository: FilmRepository) {
        this.filmRepository = filmRepository;
    }

    getFilms(): Film[] {
        const films = this.filmRepository.getFilms();
        if (!films) {
            throw new Error('Films not found');
        }
        return films;
    }
}

export default FilmService;
