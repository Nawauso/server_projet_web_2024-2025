import { AppDataSource } from "../AppDataSource";
import { GenreEntity } from "../entities/GenreEntity";
import * as fs from "fs";
import * as path from "path";

const seedGenres = async () => {
    try {
        // Charger le fichier genres.json
        const filePath = path.resolve(__dirname, "../data/genres.json");
        const genresData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Initialiser la connexion TypeORM
        await AppDataSource.initialize();
        console.log("Connexion à la base de données réussie.");

        // Récupérer le repository GenreEntity
        const genreRepository = AppDataSource.getRepository(GenreEntity);

        // Insérer les genres dans la base de données
        for (const genre of genresData) {
            const genreEntity = genreRepository.create({
                id: genre.id,
                name: genre.name,
            });
            await genreRepository.save(genreEntity);
            console.log(`Genre ajouté : ${genre.name}`);
        }

        console.log("Tous les genres ont été ajoutés à la base de données.");
        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de l'ajout des genres :", error);
        process.exit(1);
    }
};

seedGenres();
