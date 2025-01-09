import { AuthService } from '../../src/services/AuthService';
import { AppDataSource } from '../../src/AppDataSource';
import { UserEntity } from '../../src/entities/UserEntity';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/AppDataSource');

describe('AuthService', () => {
    let userRepository: any;

    beforeAll(() => {
        userRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        AppDataSource.getRepository = jest.fn().mockReturnValue(userRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('devrait retourner un token si les identifiants sont valides', async () => {
            const user = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
            userRepository.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            const token = await AuthService.login('test@example.com', 'password');

            expect(token).toBe('token');
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
            expect(jwt.sign).toHaveBeenCalledWith({ id: 1, email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        });

        it('devrait lancer une erreur si l\'utilisateur n\'est pas trouvé', async () => {
            userRepository.findOne.mockResolvedValue(null);

            await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow('Utilisateur non trouvé.');
        });

        it('devrait lancer une erreur si le mot de passe est incorrect', async () => {
            const user = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
            userRepository.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(AuthService.login('test@example.com', 'password')).rejects.toThrow('Mot de passe incorrect.');
        });
    });

    describe('register', () => {
        it('devrait enregistrer un nouvel utilisateur avec un mot de passe haché', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            userRepository.create.mockReturnValue({ email: 'test@example.com', password: 'hashedPassword' });
            userRepository.save.mockResolvedValue({});

            await AuthService.register('test@example.com', 'password');

            expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
            expect(userRepository.create).toHaveBeenCalledWith({ email: 'test@example.com', password: 'hashedPassword' });
            expect(userRepository.save).toHaveBeenCalledWith({ email: 'test@example.com', password: 'hashedPassword' });
        });
    });

    describe('userExists', () => {
        it('devrait retourner true si l\'utilisateur existe', async () => {
            userRepository.findOne.mockResolvedValue({ email: 'test@example.com' });

            const exists = await AuthService.userExists('test@example.com');

            expect(exists).toBe(true);
            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        });

        it('devrait retourner false si l\'utilisateur n\'existe pas', async () => {
            userRepository.findOne.mockResolvedValue(null);

            const exists = await AuthService.userExists('test@example.com');

            expect(exists).toBe(false);
        });
    });
});