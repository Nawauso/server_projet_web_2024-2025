import { Router } from 'express';
import ProviderService from '../services/ProviderService';
import ProviderRepository from '../repositories/ProviderRepository';

const router = Router();
const providerRepository = new ProviderRepository();
const providerService = new ProviderService(providerRepository);

router.get('/', async (req, res) => {
    try {
        const providers = await providerService.getProviders();
        res.json(providers);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

export default router;
