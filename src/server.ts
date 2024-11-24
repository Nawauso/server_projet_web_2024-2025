// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import filmRoutes from './routes/FilmRoute';
import genreRoutes from './routes/GenreRoute';
import providerRoutes from './routes/ProviderRoute';
import {AppDataSource} from "./AppDataSource";

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


AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        }).on("error", (err: Error) => {
            console.error(err);
        });
    })
    .catch((err: Error) => {
        console.error(err);
});

