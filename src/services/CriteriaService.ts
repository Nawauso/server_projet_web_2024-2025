import CriteriaRepository from "../repositories/CriteriaRepository";

type Criteria = {
    type: 'genre' | 'provider';
    id: number;
    name: string;
};

class CriteriaService {
    private criteriaRepository: CriteriaRepository;

    constructor(criteriaRepository: CriteriaRepository) {
        this.criteriaRepository = criteriaRepository;
    }

    async getCriteriasForUser(userEmail: string): Promise<Criteria[]> {
        const { genres, providers } = await this.criteriaRepository.getCriteriasForUser(userEmail);

        // Combine genres and providers into a single array
        return [
            ...genres.map((genre) => ({type: 'genre' as const, id: genre.id, name: genre.name})),
            ...providers.map((provider) => ({type: 'provider' as const, id: provider.id, name: provider.name})),
        ];
    }

    async saveCriteriasForUser(userEmail: string, genreIds: number[], providerIds: number[]): Promise<void> {
        if (!genreIds.length && !providerIds.length) {
            throw new Error('No genres or providers provided');
        }

        await this.criteriaRepository.saveCriteriasForUser(userEmail, genreIds, providerIds);
    }
}

export default CriteriaService;
