import { Router } from 'express';
import { AuthService } from '../services/AuthService';

const router = Router();

// Endpoint de connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const token = await AuthService.login(email, password);
        res.status(200).json({ token });
    } catch (err) {
        const error = err as Error;
        res.status(401).json({ message: error.message });
    }
});

export default router;
