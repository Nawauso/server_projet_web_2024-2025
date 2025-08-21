import { Router, Request, Response, NextFunction } from "express";
import FilmService from "../services/FilmService";
import FilmRepository from "../repositories/FilmRepository";

const router = Router();
const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);

// ---------- Page PRINCIPAL : anciens endpoints (DB locale) ----------

// Récupère un lot (pagination locale côté service)
router.get("/", (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            const films = await filmService.getFilms(); // lot (ex: 10)
            res.json(films);
        } catch (err) {
            console.error("GET /api/films error:", err);
            res.status(500).json({ error: (err as Error).message || "Internal error" });
        }
    })().catch(next);
});

// Réinitialise la pagination locale
router.post(
    "/reset-pagination",
    (req: Request, res: Response, next: NextFunction): void => {
        (async () => {
            try {
                filmService.resetPagination();
                res.json({ message: "Pagination reset successfully" });
            } catch (err) {
                console.error("POST /api/films/reset-pagination error:", err);
                res.status(500).json({ error: (err as Error).message || "Internal error" });
            }
        })().catch(next);
    }
);

// ---------- Page FAVORIS : nouvelles recommandations (TMDB + priorités) ----------

type FavoritesBody = {
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
        // user issu du JWT (AuthMiddleware)
        const authUserId = (req as any)?.user?.id as number | undefined;
        if (!authUserId) {
            res.status(401).json({ error: "Unauthorized: missing user in token" });
            return;
        }

        const { excludeIds = [], limit = 20, page = 1 } = req.body ?? {};
        console.log("[favorites] userId=", authUserId, "excludeIds=", excludeIds.length, "limit=", limit, "page=", page);

        try {
            const films = await filmService.getFavoriteFilmsWithPriority(authUserId, {
                excludeIds: Array.isArray(excludeIds) ? excludeIds : [],
                limit: Number(limit) || 20,
                page: Number(page) || 1,
            });
            res.json(films);
        } catch (err) {
            console.error("favorites error:", err);
            res.status(500).json({ error: (err as Error).message || "Internal error" });
        }
    })().catch(next);
};

router.post("/favorites", favoritesHandler);
// Alias de compat
router.post("/recommendations", favoritesHandler);

export default router;
