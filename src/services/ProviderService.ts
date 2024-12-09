import ProviderRepository from '../repositories/ProviderRepository';
import { Provider } from '../models/Provider';

class ProviderService {
    private providerRepository: ProviderRepository;

    constructor(providerRepository: ProviderRepository) {
        this.providerRepository = providerRepository;
    }

    async getProviders(): Promise<Provider[]> {
        const providers = await this.providerRepository.getProviders();
        if (!providers) {
            throw new Error('Providers not found');
        }
        return providers;
    }
}

export default ProviderService;
