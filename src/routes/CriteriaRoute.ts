import { Router } from 'express';
import CriteriaService from '../services/CriteriaService';
import CriteriaRepository from "../repositories/CriteriaRepository";

const router = Router();
const criteriaService = new CriteriaService(new CriteriaRepository());


router.get('/give', async (req, res) => {
    const { userId } = req.query; // Utiliser req.query pour GET

    if (!userId) {
        res.status(400).json({ error: 'Missing userId in the request query.' });
        return;
    }

    try {
        // Récupérer uniquement les genres sélectionnés pour cet utilisateur
        const criteria = await criteriaService.getCriteriasForUser(userId as string);

        res.json(criteria); // Retourner les genres sélectionnés
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
