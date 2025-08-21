import express from 'express';
import request from 'supertest';
import providerRouter from '../../src/routes/ProviderRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { ProviderEntity } from '../../src/entities/ProviderEntity';

describe('ProviderRoute (integration)', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    // seed
    const repo = AppDataSource.getRepository(ProviderEntity);
    const p1 = repo.create({ name: 'Netflix', logoUrl: '/n.png', tmdbId: 8 });
    const p2 = repo.create({ name: 'Prime Video', logoUrl: '/p.png', tmdbId: 9 });
    await repo.save([p1, p2]);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('GET /providers returns providers from DB mapped to model', async () => {
    const app = express();
    app.use('/providers', providerRouter);

    const res = await request(app).get('/providers').expect(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Netflix' }),
        expect.objectContaining({ name: 'Prime Video' }),
      ])
    );
  });
});