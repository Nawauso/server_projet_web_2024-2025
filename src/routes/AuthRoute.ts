import { Router, Request, Response} from 'express';
import { AuthService } from '../services/AuthService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

interface CustomRequest extends Request {
    user?: any;
}

const router = Router();

// Endpoint de connexion
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const token = await AuthService.login(email, password);
        res.status(200).json({ token });
        console.log("Connexion réussie.");
    } catch (err) {
        const error = err as Error;
        res.status(401).json({ message: error.message });
        console.log("Connexion échouée.");
    }
});

// Endpoint pour vérifier l'authentification
router.get('/verify', AuthMiddleware, (req: CustomRequest, res: Response) => {
    const user = req.user; // Récupère l'utilisateur décodé depuis le token
    res.status(200).json({ message: "Authentification valide.", user });
    console.log("Authentification valide.");
});

export default router;