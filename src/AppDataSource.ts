import { DataSource } from "typeorm";
import {UserEntity} from "./entities/UserEntity";
import {FilmEntity} from "./entities/FilmEntity";
import {GroupEntity} from "./entities/GroupEntity";
import {ProviderEntity} from "./entities/ProviderEntity";
import {GenreEntity} from "./entities/GenreEntity";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "test.db",
    synchronize: true,
    logging: true,
    entities: [UserEntity, FilmEntity, GroupEntity, ProviderEntity, GenreEntity],
    subscribers: [],
    migrations: [],
});
