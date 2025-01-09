import CriteriaRepository from "../repositories/CriteriaRepository";
import {ProviderEntity} from "../entities/ProviderEntity";
import {GenreEntity} from "../entities/GenreEntity";

class CriteriaService {
    private criteriaRepository: CriteriaRepository;

    constructor(criteriaRepository: CriteriaRepository) {
        this.criteriaRepository = criteriaRepository;
    }

    // Récupérer uniquement les genres sélectionnés pour un utilisateur
    async getSelectedGenresForUser(userEmail: string): Promise<GenreEntity[]> {
        const { genres } = await this.criteriaRepository.getCriteriasForUser(userEmail);
        return genres; // Retourner uniquement les genres
    }

    // Récupérer uniquement les providers sélectionnés pour un utilisateur
    async getSelectedProvidersForUser(userEmail: string): Promise<ProviderEntity[]> {
        const { providers } = await this.criteriaRepository.getCriteriasForUser(userEmail);
        return providers; // Retourner uniquement les providers
    }

    async saveCriteriasForUser(userEmail: string, genreIds: number[], providerIds: number[]): Promise<void> {
        await this.criteriaRepository.saveCriteriasForUser(userEmail, genreIds, providerIds);
    }
}

export default CriteriaService;
