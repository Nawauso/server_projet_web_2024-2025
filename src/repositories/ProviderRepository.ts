import * as fs from 'fs';
import * as path from 'path';
import { Provider } from '../models/Provider';

class ProviderRepository {
    private providerDataPath = path.resolve(__dirname, '../data/providers.json');

    getProviders(): Provider[] | null {
        if (fs.existsSync(this.providerDataPath)) {
            const data = fs.readFileSync(this.providerDataPath, 'utf8');
            return JSON.parse(data) as Provider[];
        }
        return null;
    }
}

export default ProviderRepository;
