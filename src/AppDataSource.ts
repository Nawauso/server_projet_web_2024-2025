import 'reflect-metadata';
import { DataSource } from "typeorm";
import dotenv from 'dotenv';
dotenv.config();

import { UserEntity } from "./entities/UserEntity";
import { FilmEntity } from "./entities/FilmEntity";
import { GroupEntity } from "./entities/GroupEntity";
import { ProviderEntity } from "./entities/ProviderEntity";
import { GenreEntity } from "./entities/GenreEntity";
import { GroupFilmPriorityEntity } from "./entities/GroupFilmPriorityEntity";

const DB_PATH = process.env.DB_PATH || 'Netflux.db';

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: DB_PATH,
    synchronize: true, // à garder uniquement en dev
    logging: true,
    entities: [
        UserEntity,
        FilmEntity,
        GroupEntity,
        ProviderEntity,
        GenreEntity,
        GroupFilmPriorityEntity, // ← important
    ],
    subscribers: [],
    migrations: [],
});
