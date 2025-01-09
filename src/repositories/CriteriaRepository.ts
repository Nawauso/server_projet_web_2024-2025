import { ProviderEntity } from "../entities/ProviderEntity";
import { AppDataSource } from "../AppDataSource";
import { UserEntity } from "../entities/UserEntity";
import { GenreEntity } from "../entities/GenreEntity";
import {In} from "typeorm";

class CriteriaRepository {
    private userRepository = AppDataSource.getRepository(UserEntity);
    private genreRepository = AppDataSource.getRepository(GenreEntity);
    private providerRepository = AppDataSource.getRepository(ProviderEntity);

    // Recherche l'ID de l'utilisateur à partir de son email
    async findUserIdByEmail(email: string): Promise<number> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user) {
            throw new Error(`User with email ${email} not found`);
        }
        return user.id;
    }

    async getCriteriasForUser(email: string): Promise<{ genres: GenreEntity[], providers: ProviderEntity[] }> {
        const userId = await this.findUserIdByEmail(email); // Recherche l'ID via l'email

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'], // Charger les relations nécessaires
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        return {
            genres: user.selectedGenres,
            providers: user.selectedProviders,
        };
    }

    async saveCriteriasForUser(email: string, genreIds: number[], providerIds: number[]): Promise<void> {
        const userId = await this.findUserIdByEmail(email); // Recherche l'ID via l'email

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'], // Charger les relations nécessaires
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Récupérer les genres et providers par leurs IDs
        const genres = await this.genreRepository.find({
            where: { id: In(genreIds) },
        });
        const providers = await this.providerRepository.find({
            where: { id: In(providerIds) },
        });

        // Associer les genres et providers à l'utilisateur
        user.selectedGenres = genres;
        user.selectedProviders = providers;

        // Sauvegarder l'utilisateur avec ses relations mises à jour
        await this.userRepository.save(user);
    }
}

export default CriteriaRepository;
