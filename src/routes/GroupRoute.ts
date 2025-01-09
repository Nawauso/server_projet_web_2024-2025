import { Router } from 'express';
import { GroupService } from '../services/GroupService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// Récupère le groupe de l'utilisateur connecté
router.get('/my-group', async (req, res) => {
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
router.post('/create', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { groupName } = req.body;
        const group = await GroupService.createGroup(userId, groupName);
        res.status(201).json({ message: "Groupe créé avec succès.", group });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// Rejoindre un groupe existant
router.post('/join', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { groupName } = req.body;
        const group = await GroupService.joinGroup(userId, groupName);
        res.status(200).json({ message: "Rejoint le groupe avec succès.", group });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

export default router;
