import { Provider } from '../models/Provider';
import {AppDataSource} from "../AppDataSource";
import {ProviderEntity} from "../entities/ProviderEntity";

class ProviderRepository {
    private providerRepository = AppDataSource.getRepository(ProviderEntity);

    async getProviders(): Promise<Provider[]> {
        const provider = await this.providerRepository.find(); // Récupère toutes les données dans la table Provider
        return provider.map(ProviderEntity => new Provider(ProviderEntity.id, ProviderEntity.name, ProviderEntity.logoUrl));
    }

}

export default ProviderRepository;
