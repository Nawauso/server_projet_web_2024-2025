import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserEntity } from '../entities/UserEntity';
import { AppDataSource } from '../AppDataSource';

const userRepository = AppDataSource.getRepository(UserEntity);

export class AuthService {
    static async login(email: string, password: string): Promise<string> {
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            throw new Error('Utilisateur non trouvé.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Mot de passe incorrect.');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        return token;
    }
}
