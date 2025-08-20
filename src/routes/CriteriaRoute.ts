import { Router, Request, Response, RequestHandler } from 'express';
import { AppDataSource } from '../AppDataSource';
import { UserEntity } from '../entities/UserEntity';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { GenreEntity } from '../entities/GenreEntity';
import { ProviderEntity } from '../entities/ProviderEntity';
import { In } from 'typeorm';

const router = Router();

// GET /api/criterias/selected  -> { genres:number[], providers:number[] }
const getSelected: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const user = await AppDataSource.getRepository(UserEntity).findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'],
        });

        if (!user) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }

        res.json({
            genres: (user.selectedGenres ?? []).map(g => g.id),
            providers: (user.selectedProviders ?? []).map(p => p.id),
        });
    } catch (err: any) {
        console.error('GET /api/criterias/selected failed:', err?.stack || err);
        res.status(500).json({ message: 'Erreur lors de la récupération des critères.' });
    }
};

// PUT /api/criterias/selected  body: { genres:number[], providers:number[] }
const putSelected: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { genres = [], providers = [] } = req.body as { genres: number[]; providers: number[] };

        const userRepo = AppDataSource.getRepository(UserEntity);
        const genreRepo = AppDataSource.getRepository(GenreEntity);
        const providerRepo = AppDataSource.getRepository(ProviderEntity);

        const user = await userRepo.findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'],
        });

        if (!user) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }

        const newGenres = genres.length ? await genreRepo.findBy({ id: In(genres) }) : [];
        const newProviders = providers.length ? await providerRepo.findBy({ id: In(providers) }) : [];

        user.selectedGenres = newGenres;
        user.selectedProviders = newProviders;
        await userRepo.save(user);

        res.json({ message: 'Critères enregistrés.' });
    } catch (err: any) {
        console.error('PUT /api/criterias/selected failed:', err?.stack || err);
        res.status(500).json({ message: 'Erreur lors de l’enregistrement des critères.' });
    }
};

router.get('/selected', AuthMiddleware as unknown as RequestHandler, getSelected);
router.put('/selected', AuthMiddleware as unknown as RequestHandler, putSelected);

export default router;
