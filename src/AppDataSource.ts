import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "test.db",
    synchronize: true,
    logging: true,
    entities: [],
    subscribers: [],
    migrations: [],
});
