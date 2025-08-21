import ProviderService from '../../src/services/ProviderService';
import ProviderRepository from '../../src/repositories/ProviderRepository';
import { Provider } from '../../src/models/Provider';

class FakeRepo implements Partial<ProviderRepository> {
  providers: Provider[] | null = [new Provider(1, 'Netflix', '/n.png')];
  async getProviders(): Promise<Provider[]> {
    // @ts-ignore
    if (this.providers === null) return this.providers as any;
    return this.providers!;
  }
}

describe('ProviderService', () => {
  it('returns providers from repository', async () => {
    const repo = new FakeRepo();
    const service = new ProviderService(repo as any);
    const result = await service.getProviders();
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Provider);
    expect((result[0] as any).name).toBe('Netflix');
  });

  it('throws when repository returns falsy', async () => {
    const repo = new FakeRepo();
    repo.providers = null as any;
    const service = new ProviderService(repo as any);
    await expect(service.getProviders()).rejects.toThrow('Providers not found');
  });
});