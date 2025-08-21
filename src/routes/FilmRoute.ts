import { Router, Request, Response, NextFunction } from "express";
import FilmService from "../services/FilmService";
import FilmRepository from "../repositories/FilmRepository";

const router = Router();
const filmRepository = new FilmRepository();
const filmService = new FilmService(filmRepository);

// ---------- Ancien système (DB locale) : utilisé ailleurs ----------
router.get("/", (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            const films = await filmService.getFilms();
            res.json(films);
        } catch (err) {
            console.error("GET /api/films error:", err);
            res.status(500).json({ error: (err as Error).message || "Internal error" });
        }
    })().catch(next);
});

router.post("/reset-pagination", (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        try {
            filmService.resetPagination();
            res.json({ message: "Pagination reset successfully" });
        } catch (err) {
            console.error("POST /api/films/reset-pagination error:", err);
            res.status(500).json({ error: (err as Error).message || "Internal error" });
        }
    })().catch(next);
});

// ---------- Favoris (déjà en place) ----------
type FavoritesBody = { excludeIds?: number[]; limit?: number; page?: number; };

const favoritesHandler = (
    req: Request<{}, any, FavoritesBody>, res: Response, next: NextFunction
): void => {
    (async () => {
        const authUserId = (req as any)?.user?.id as number | undefined;
        if (!authUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const { excludeIds = [], limit = 20, page = 1 } = req.body ?? {};
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
router.post("/recommendations", favoritesHandler);

// ---------- NOUVEAU : Flux HOME trié (prio groupe/perso -> filtres groupe -> défaut) ----------
router.get("/home", (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
        const authUserId = (req as any)?.user?.id as number | undefined;
        if (!authUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

        const limit = Math.max(1, Math.min(40, Number(req.query.limit) || 20));
        const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

        try {
            const out = await filmService.getHomeFeed(authUserId, { limit, cursor });
            res.json(out); // { items, nextCursor?, notice? }
        } catch (err) {
            console.error("home feed error:", err);
            res.status(500).json({ error: (err as Error).message || "Internal error" });
        }
    })().catch(next);
});

export default router;
