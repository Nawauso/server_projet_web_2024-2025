import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import 'reflect-metadata';

import filmRoutes from './routes/FilmRoute';
import genreRoutes from './routes/GenreRoute';
import providerRoutes from './routes/ProviderRoute';
import authRoutes from './routes/AuthRoute';
import criteriaRoutes from './routes/CriteriaRoute';
import groupRoutes from './routes/GroupRoute';
import userRoutes from './routes/UserRoute';
import rankRoutes from './routes/RankRoute';

import { AppDataSource } from './AppDataSource';
import { AuthMiddleware } from './middlewares/AuthMiddleware';

import { seedGenres } from './seed/SeedGenre';
import { seedProviders } from './seed/SeedProvider';

import { UserEntity } from './entities/UserEntity';
import bcrypt from 'bcrypt';

dotenv.config();
const app = express();
const PORT = process.env.PORT || '8080';

const corsOptions = {
    origin: ['http://localhost:5173'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes protégées
app.use('/api/groups', AuthMiddleware, groupRoutes);
app.use('/api/films', AuthMiddleware, filmRoutes);
app.use('/api/genres', AuthMiddleware, genreRoutes);
app.use('/api/providers', AuthMiddleware, providerRoutes);
app.use('/api/criterias', AuthMiddleware, criteriaRoutes);
app.use('/api/users', AuthMiddleware, userRoutes);
app.use('/api/rank', AuthMiddleware, rankRoutes);
app.use('/api/auth', authRoutes);

AppDataSource.initialize()
    .then(async () => {
        try {
            const [g, p, u] = await Promise.all([seedGenres(), seedProviders(), seedUsers()]);
            console.log(`Seeds OK -> genres:+${g}, providers:+${p}, users:+${u}`);
        } catch (e) {
            console.error('Erreur lors des seeds initiaux :', e);
        }

        app
            .listen(PORT, () => {
                console.log(`Server started on port ${PORT}`);
            })
            .on('error', (err: Error) => {
                console.error(err);
            });
    })
    .catch((err: Error) => {
        console.error(err);
    });

async function seedUsers(): Promise<number> {
    const repo = AppDataSource.getRepository(UserEntity);

    const wanted = [
        { email: 'admin@cool.com', password: 'admin', firstName: 'Admin', lastName: 'Cool' },
        { email: 'user@cool.com',  password: 'user',  firstName: 'User',  lastName: 'Cool'  },
    ];

    let inserted = 0;
    for (const w of wanted) {
        const exists = await repo.findOne({ where: { email: w.email } });
        if (exists) continue;

        const userData: Partial<UserEntity> = {
            email: w.email,
            password: await bcrypt.hash(w.password, 10),
            // Si vos colonnes firstName/lastName n'existent pas ou ne sont pas nullable, adaptez ici.
            firstName: (w as any).firstName,
            lastName:  (w as any).lastName,
        };

        const user = repo.create(userData as UserEntity);
        await repo.save(user);
        inserted++;
        console.log(`User seeded: ${w.email}`);
    }
    return inserted;
}
