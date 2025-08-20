import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import "reflect-metadata";
import filmRoutes from './routes/FilmRoute';
import genreRoutes from './routes/GenreRoute';
import providerRoutes from './routes/ProviderRoute';
import authRoutes from './routes/AuthRoute';
import criteriaRoutes from './routes/CriteriaRoute';
import groupRoutes from './routes/GroupRoute';
import { AppDataSource } from "./AppDataSource";
import {AuthMiddleware} from "./middlewares/AuthMiddleware";
import { seedGenres } from './seed/SeedGenre';
import { seedProviders } from './seed/SeedProvider';

dotenv.config();
const app = express();
const PORT = process.env.PORT || '8080';

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/groups', AuthMiddleware, groupRoutes);
app.use('/api/films', AuthMiddleware, filmRoutes);
app.use('/api/genres', AuthMiddleware, genreRoutes);
app.use('/api/providers', AuthMiddleware, providerRoutes);
app.use('/api/criterias', AuthMiddleware, criteriaRoutes);
app.use('/api/auth', authRoutes);

AppDataSource.initialize()
    .then(async () => {
        try {
            const [g, p] = await Promise.all([
                seedGenres(),      // idempotent (n’ajoute pas les doublons)
                seedProviders(),
            ]);
            console.log(`Seeds OK -> genres:+${g}, providers:+${p}`);
        } catch (e) {
            console.error('Erreur lors des seeds initiaux :', e);
        }

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        }).on("error", (err: Error) => {
            console.error(err);
        });
    })
    .catch((err: Error) => {
        console.error(err);
    });