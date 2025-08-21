import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";
import { GroupFilmPriorityEntity } from "../entities/GroupFilmPriorityEntity";
import { FilmEntity } from "../entities/FilmEntity";
import FilmRepository from "../repositories/FilmRepository";

const router = Router();
const filmRepo = new FilmRepository();

/**
 * POST /api/rank
 * Body: { filmId: number, delta: 1 | -1 }
 * - Enregistre le vote perso (likedFilms / dislikedFilms)
 * - Si user a un groupe: incrémente/décrémente la priority du film pour le groupe (min = -1)
 * - Garantit l’existence du film en DB (fetch TMDB si besoin)
 */
router.post(
    "/",
    (req: Request, res: Response, next: NextFunction): void => {
        (async () => {
            const userId = (req as any)?.user?.id as number | undefined;
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const filmId = Number(req.body?.filmId);
            const delta  = Number(req.body?.delta);
            if (!Number.isInteger(filmId) || ![1, -1].includes(delta)) {
                res.status(400).json({ error: "Body invalide: { filmId: number, delta: 1 | -1 }" });
                return;
            }

            // 1) S'assurer que le film existe côté DB
            const film: FilmEntity = await filmRepo.ensureFilmInDB(filmId);

            // 2) Charger l'utilisateur + relations
            const userRepository = AppDataSource.getRepository(UserEntity);
            const user = await userRepository.findOne({
                where: { id: userId },
                relations: ["group", "likedFilms", "dislikedFilms"],
            });
            if (!user) {
                res.status(404).json({ error: "Utilisateur introuvable" });
                return;
            }

            // 3) Vote personnel
            const likedMap    = new Map<number, FilmEntity>((user.likedFilms ?? []).map(f => [f.id, f]));
            const dislikedMap = new Map<number, FilmEntity>((user.dislikedFilms ?? []).map(f => [f.id, f]));
            if (delta === 1) {
                likedMap.set(film.id, film);
                dislikedMap.delete(film.id);
            } else {
                dislikedMap.set(film.id, film);
                likedMap.delete(film.id);
            }
            user.likedFilms = Array.from(likedMap.values());
            user.dislikedFilms = Array.from(dislikedMap.values());
            await userRepository.save(user);

            // 4) Vote groupe (si applicable)
            let groupPriority: number | null = null;
            if (user.group?.id) {
                const gfpRepo = AppDataSource.getRepository(GroupFilmPriorityEntity);
                let row = await gfpRepo.findOne({ where: { groupId: user.group.id, filmId: film.id } });
                if (!row) row = gfpRepo.create({ groupId: user.group.id, filmId: film.id, priority: 0 });

                let next = (row.priority ?? 0) + (delta === 1 ? 1 : -1);
                if (next < -1) next = -1; // borne basse
                row.priority = next;

                await gfpRepo.save(row);
                groupPriority = row.priority;
            }

            res.json({
                ok: true,
                filmId: film.id,
                delta,
                groupPriority, // null si pas de groupe
            });
        })().catch(next);
    }
);

export default router;
