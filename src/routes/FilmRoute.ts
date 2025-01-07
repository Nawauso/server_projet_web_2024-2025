import { Router } from 'express';
import FilmService from '../services/FilmService';
import FilmRepository from '../repositories/FilmRepository';

const router = Router();
const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);


// Route pour récupérer les films paginés
router.get('/', async (req, res) => {
    try {
        const films = await filmService.getFilms(); // Récupère les films par lot de 10
        res.json(films);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

// Route pour réinitialiser le compteur de pagination
router.post('/reset-pagination', (req, res) => {
    try {
        filmService.resetPagination(); // Réinitialise le compteur de pagination à 1
        res.json({ message: 'Pagination reset successfully' });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});
export default router;
