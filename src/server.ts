import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import "reflect-metadata";
import filmRoutes from './routes/FilmRoute';
import genreRoutes from './routes/GenreRoute';
import providerRoutes from './routes/ProviderRoute';
import authRoutes from './routes/AuthRoute';
import { AppDataSource } from "./AppDataSource";
import { UserEntity } from "./entities/UserEntity";
import bcrypt from "bcrypt";

dotenv.config();
const app = express();
const PORT = process.env.PORT || '8080';

const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/films', filmRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/auth', authRoutes);

AppDataSource.initialize()
    .then(async () => {
        await seedData();
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        }).on("error", (err: Error) => {
            console.error(err);
        });
    })
    .catch((err: Error) => {
        console.error(err);
    });

const seedData = async () => {
    const userRepository = AppDataSource.getRepository(UserEntity);
        const users = [
            {
                id: 1,
                firstName: "admin",
                lastName: "admin",
                email: "admin@cool.com",
                password: await bcrypt.hash("admin", 10)
            },
            {
                id: 2,
                firstName: "user",
                lastName: "user",
                email: "user@cool.com",
                password: await bcrypt.hash("user", 10)
            }
        ];

        console.log("Seeding users...");
        for (const userData of users) {
            const user = userRepository.create(userData);
            await userRepository.save(user);
            console.log(`User seeded: ${user.email}`);
        }
        console.log("Data seeding complete.");
}

