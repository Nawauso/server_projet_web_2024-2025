import { AppDataSource } from "../AppDataSource";
import { ProviderEntity } from "../entities/ProviderEntity";
import * as fs from "fs";
import * as path from "path";

 const seedProvider = async () => {
    try {
        // Charger le fichier genres.json
        const filePath = path.resolve(__dirname, "../data/providers.json");
        const providersData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Initialiser la connexion TypeORM
        await AppDataSource.initialize();

        console.log("Connexion à la base de données réussie.");

        // Récupérer le repository GenreEntity
        const providerRepository = AppDataSource.getRepository(ProviderEntity);

        // Insérer les genres dans la base de données
        for (const provider of providersData) {
            const providerEntity = providerRepository.create({
                id: provider.provider_ID,
                name: provider.provider_Name,
                logoUrl: provider.logo_Path,
            });
            await providerRepository.save(providerEntity);
            console.log(`Genre ajouté : ${provider.name}`);
        }

        console.log("Tous les genres ont été ajoutés à la base de données.");
        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de l'ajout des genres :", error);
        process.exit(1);
    }
};

seedProvider();

