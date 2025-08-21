import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";
import { FilmEntity } from "../entities/FilmEntity";
import FilmRepository from "../repositories/FilmRepository";

const router = Router();
const filmRepo = new FilmRepository();

/**
 * Enregistre un vote personnel sur un film (like / dislike) pour l'utilisateur authentifié.
 * Body: { filmId: number, delta: 1 | -1 }
 * - delta = +1  => ajoute à likedFilms, retire de dislikedFilms
 * - delta = -1  => ajoute à dislikedFilms, retire de likedFilms
 *
 * NB: On s'assure que le Film existe en DB (création si besoin via TMDB).
 */
router.post(
    "/rank",
    (req: Request, res: Response, next: NextFunction): void => {
        (async () => {
            const userId = (req as any)?.user?.id as number | undefined;
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const filmId = Number(req.body?.filmId);
            const delta = Number(req.body?.delta);
            if (!Number.isInteger(filmId) || ![1, -1].includes(delta)) {
                res.status(400).json({ error: "Body invalide: { filmId: number, delta: 1 | -1 }" });
                return;
            }

            // 1) S'assurer que le film existe dans la DB locale
            const film = await filmRepo.ensureFilmInDB(filmId);

            // 2) Charger l'utilisateur avec relations
            const userRepository = AppDataSource.getRepository(UserEntity);
            const user = await userRepository.findOne({
                where: { id: userId },
                relations: ["likedFilms", "dislikedFilms"],
            });
            if (!user) {
                res.status(404).json({ error: "Utilisateur introuvable" });
                return;
            }

            const liked = new Map<number, FilmEntity>((user.likedFilms ?? []).map(f => [f.id, f]));
            const disliked = new Map<number, FilmEntity>((user.dislikedFilms ?? []).map(f => [f.id, f]));

            if (delta === 1) {
                liked.set(film.id, film);
                disliked.delete(film.id);
            } else {
                disliked.set(film.id, film);
                liked.delete(film.id);
            }

            user.likedFilms = Array.from(liked.values());
            user.dislikedFilms = Array.from(disliked.values());

            await userRepository.save(user);

            res.json({
                ok: true,
                filmId: film.id,
                liked: delta === 1,
                disliked: delta === -1,
            });
        })().catch(next);
    }
);

export default router;
