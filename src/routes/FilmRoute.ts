import { Router } from 'express';
import FilmService from '../services/FilmService';
import FilmRepository from '../repositories/FilmRepository';

const router = Router();
const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);

router.get('/', (req, res) => {
    try {
        const films = filmService.getFilms();
        res.json(films);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

export default router;
