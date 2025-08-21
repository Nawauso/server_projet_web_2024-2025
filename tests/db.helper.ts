import { AppDataSource } from '../src/AppDataSource';
import { ProviderEntity } from '../src/entities/ProviderEntity';
import { UserEntity } from '../src/entities/UserEntity';

export async function initTestDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}

export async function clearDb() {
  if (!AppDataSource.isInitialized) return;
  const entities = [ProviderEntity, UserEntity];
  for (const entity of entities) {
    const repo = AppDataSource.getRepository(entity);
    await repo.clear();
  }
}