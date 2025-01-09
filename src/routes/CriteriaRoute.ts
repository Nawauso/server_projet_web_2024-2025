import { Router } from 'express';
import CriteriaService from '../services/CriteriaService';
import CriteriaRepository from "../repositories/CriteriaRepository";

const router = Router();
const criteriaService = new CriteriaService(new CriteriaRepository());
router.get('/giveGenres', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        res.status(400).json({ error: 'Missing userId in the request query.' });
        return;
    }

    try {
        const genres = await criteriaService.getSelectedGenresForUser(userId as string);
        res.json(genres);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

// Endpoint pour les providers sélectionnés
router.get('/giveProviders', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        res.status(400).json({ error: 'Missing userId in the request query.' });
        return;
    }

    try {
        const providers = await criteriaService.getSelectedProvidersForUser(userId as string);
        res.json(providers);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});



// Enregistrement des critères
router.post('/', async (req, res) => {
    const { genreIds, providerIds, userId } = req.body;

    // Validation des données reçues
    if (!userId) {
        res.status(400).json({ error: 'Missing userId in the request body.' });
        return;
    }
    if (!Array.isArray(genreIds) || !Array.isArray(providerIds)) {
        res.status(400).json({ error: 'Invalid data format. genreIds and providerIds must be arrays.' });
        return;
    }

    try {
        await criteriaService.saveCriteriasForUser(userId, genreIds, providerIds);
        res.status(200).json({ message: 'Criterias saved successfully' });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

export default router;
