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

    // Récupérer uniquement les genres sélectionnés pour un utilisateur
    async getSelectedGenresForUser(email: string): Promise<GenreEntity[]> {
        const userId = await this.findUserIdByEmail(email);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['selectedGenres'], // Charger uniquement les genres
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        return user.selectedGenres;
    }

    // Récupérer uniquement les providers sélectionnés pour un utilisateur
    async getSelectedProvidersForUser(email: string): Promise<ProviderEntity[]> {
        const userId = await this.findUserIdByEmail(email);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['selectedProviders'], // Charger uniquement les providers
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        return user.selectedProviders;
    }

    async getCriteriasForUser(email: string): Promise<{ genres: GenreEntity[], providers: ProviderEntity[] }> {
        const userId = await this.findUserIdByEmail(email);

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
        const userId = await this.findUserIdByEmail(email);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['selectedGenres', 'selectedProviders'],
        });

        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const genres = await this.genreRepository.find({ where: { id: In(genreIds) } });
        const providers = await this.providerRepository.find({ where: { id: In(providerIds) } });

        user.selectedGenres = genres;
        user.selectedProviders = providers;

        await this.userRepository.save(user);
    }
}

export default CriteriaRepository;

