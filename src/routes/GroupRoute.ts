import { Router, Request, Response, NextFunction } from 'express';
import { GroupService } from '../services/GroupService';
import { GroupFilmPriorityEntity } from '../entities/GroupFilmPriorityEntity';
import { AppDataSource } from '../AppDataSource';

const router = Router();

// Récupère le groupe de l'utilisateur connecté
router.get('/my-group', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const groupData = await GroupService.getUserGroup(userId);
        res.status(200).json(groupData);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// Crée un nouveau groupe
router.post('/create', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { groupName } = req.body as { groupName: string };
        const group = await GroupService.createGroup(userId, groupName);
        res.status(201).json({ message: 'Groupe créé avec succès.', group });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// Rejoindre un groupe existant
router.post('/join', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { groupName } = req.body as { groupName: string };
        const group = await GroupService.joinGroup(userId, groupName);
        res.status(200).json({ message: 'Rejoint le groupe avec succès.', group });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

/**
 * Like/Dislike d'un film pour un groupe (pas pour "Passer").
 * POST /api/groups/:groupId/rank
 * Body: { filmId: number, delta: +1 | -1 }
 *
 * Règles:
 *  - borne basse = -1 (blacklist),
 *  - +1 augmente la priorité (depuis -1 -> 0 -> 1...),
 *  - -1 la diminue jusqu'à -1 max.
 */
type RankParams = { groupId: string };
type RankBody = { filmId: number; delta: 1 | -1 };

const rankHandler = (req: Request<RankParams, any, RankBody>, res: Response, next: NextFunction): void => {
    // IIFE async pour garder un handler non-async (retour void)
    (async () => {

        const groupId = Number(req.params.groupId);
        const { filmId, delta } = (req.body ?? {}) as RankBody;

        if (!Number.isInteger(groupId) || !Number.isInteger(filmId)) {
            res.status(400).json({ message: 'groupId et filmId doivent être des entiers.' });
            return;
        }
        if (delta !== 1 && delta !== -1) {
            res.status(400).json({ message: 'delta doit valoir +1 (like) ou -1 (dislike).' });
            return;
        }

        try {
            const repo = AppDataSource.getRepository(GroupFilmPriorityEntity);
            let row = await repo.findOne({ where: { groupId, filmId } });
            if (!row) {
                row = repo.create({ groupId, filmId, priority: 0 });
            }

            let nextPriority = (row.priority ?? 0) + delta;
            if (nextPriority < -1) nextPriority = -1; // borne basse -1
            row.priority = nextPriority;

            await repo.save(row);
            res.json({ filmId, groupId, priority: nextPriority });
        } catch (e) {
            console.error('rank error:', e);
            next(e); // délègue à l’error handler express
        }
    })().catch(next);
};

// Astuce supplémentaire : on peut typer le routeur pour lever toute ambiguïté d’overload
router.post<RankParams>('/:groupId/rank', rankHandler);

export default router;
