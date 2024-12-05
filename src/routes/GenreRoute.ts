import { Router } from 'express';
import GenreService from '../services/GenreService';
import GenreRepository from '../repositories/GenreRepository';

const router = Router();
const genreRepository = new GenreRepository();
const genreService = new GenreService(genreRepository);

router.get('/', async (req, res) => {
    try {
        const genres = await genreService.getGenres();
        res.json(genres);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

export default router;
