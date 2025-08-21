import { Router, Request, Response, NextFunction } from 'express';
import FilmService from '../services/FilmService';
import FilmRepository from '../repositories/FilmRepository';

const router = Router();
const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);

// -----------------------------
// GET /api/films  (DB paginée)
// -----------------------------
const getFilmsHandler = (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            const films = await filmService.getFilms(); // lot de 10
            res.json(films);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    })().catch(next);
};

router.get('/', getFilmsHandler);

// ---------------------------------------------------------------------
// POST /api/films/favorites  (TMDB + filtres + priorités de groupe)
// ---------------------------------------------------------------------
type FavoritesBody = {
    userId: number | string;
    excludeIds?: number[];
    limit?: number;
    page?: number;
};

const favoritesHandler = (
    req: Request<{}, any, FavoritesBody>,
    res: Response,
    next: NextFunction
): void => {
    (async () => {
        const { userId, excludeIds = [], limit = 20, page = 1 } = req.body ?? ({} as FavoritesBody);

        if (!userId) {
            res.status(400).json({ error: 'Missing userId in the request body.' });
            return;
        }

        try {
            const films = await filmService.getFavoriteFilmsWithPriority(userId, {
                excludeIds: Array.isArray(excludeIds) ? excludeIds : [],
                limit: Number(limit) || 20,
                page: Number(page) || 1,
            });
            res.json(films);
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    })().catch(next);
};

router.post('/favorites', favoritesHandler);

// -------------------------------------------------------------
// POST /api/films/reset-pagination  (reset compteur interne DB)
// -------------------------------------------------------------
const resetPaginationHandler = (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            filmService.resetPagination();
            res.json({ message: 'Pagination reset successfully' });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    })().catch(next);
};

router.post('/reset-pagination', resetPaginationHandler);

export default router;
