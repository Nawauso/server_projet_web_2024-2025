import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {UserEntity} from '../entities/UserEntity';
import {AppDataSource} from '../AppDataSource';

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
            {id: user.id, email: user.email},
            process.env.JWT_SECRET as string,
            {expiresIn: '1h'}
        );
        return token;
    }

    static async register(email: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = userRepository.create({
            email,
            password: hashedPassword,
        });
        await userRepository.save(newUser);
    }

    static async userExists(email: string): Promise<boolean> {
        const user = await userRepository.findOne({ where: { email } });
        return !!user;
    }
}
