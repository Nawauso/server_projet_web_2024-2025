import { AuthService } from '../../src/services/AuthService';
import authRouter from '../../src/routes/AuthRoute';
import { Request, Response, Router } from 'express';
import express from 'express';

jest.mock('../../src/services/AuthService');

describe('AuthRoute', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let router: Router;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        router = authRouter;
    });

    describe('POST /auth/login', () => {
        it('devrait retourner un token si les identifiants sont valides', async () => {
            req.body = { email: 'test@cool.com', password: 'cool' };
            (AuthService.login as jest.Mock).mockResolvedValue('token');

            // Simulation d'un handler spécifique
            const route = router.stack.find((r) => r.route?.path === '/login')?.route?.stack[0];
            if (route) {
                await route.handle(req as Request, res as Response, next);
            }

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ token: 'token' });
        });

        it('devrait retourner une erreur si les identifiants sont invalides', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };
            (AuthService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

            const route = router.stack.find((r) => r.route?.path === '/login')?.route?.stack[0];
            if (route) {
                await route.handle(req as Request, res as Response, next);
            }

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });

    describe('POST /auth/register', () => {
        it('devrait enregistrer un nouvel utilisateur', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            (AuthService.register as jest.Mock).mockResolvedValue(undefined);
            (AuthService.userExists as jest.Mock).mockResolvedValue(false);

            const route = router.stack.find((r) => r.route?.path === '/register')?.route?.stack[0];
            if (route) {
                await route.handle(req as Request, res as Response, next);
            }

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur créé avec succès.' });
        });

        it('devrait retourner une erreur si l\'enregistrement échoue', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            (AuthService.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));
            (AuthService.userExists as jest.Mock).mockResolvedValue(false);

            const route = router.stack.find((r) => r.route?.path === '/register')?.route?.stack[0];
            if (route) {
                await route.handle(req as Request, res as Response, next);
            }

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Erreur lors de l\'inscription.' });
        });

        it('devrait retourner une erreur si l\'email est déjà utilisé', async () => {
            req.body = { email: 'test@cool.com', password: 'password' };
            (AuthService.userExists as jest.Mock).mockResolvedValue(true);

            const route = router.stack.find((r) => r.route?.path === '/register')?.route?.stack[0];
            if (route) {
                await route.handle(req as Request, res as Response, next);
            }

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'L\'email est déjà utilisé.' });
        });
    });
});
