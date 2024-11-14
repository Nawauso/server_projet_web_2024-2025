import ProviderRepository from '../repositories/ProviderRepository';
import { Provider } from '../models/Provider';

class ProviderService {
    private providerRepository: ProviderRepository;

    constructor(providerRepository: ProviderRepository) {
        this.providerRepository = providerRepository;
    }

    getProviders(): Provider[] {
        const providers = this.providerRepository.getProviders();
        if (!providers) {
            throw new Error('Providers not found');
        }
        return providers;
    }
}

export default ProviderService;
