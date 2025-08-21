import express from 'express';
import request from 'supertest';
import genreRouter from '../../src/routes/GenreRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { GenreEntity } from '../../src/entities/GenreEntity';

describe('GenreRoute (integration)', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const repo = AppDataSource.getRepository(GenreEntity);
    await repo.save(repo.create({ name: 'Action', tmdbId: 28 }));
    await repo.save(repo.create({ name: 'Drama', tmdbId: 18 }));
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('GET /genres returns genres mapped to model', async () => {
    const app = express();
    app.use('/genres', genreRouter);

    const res = await request(app).get('/genres').expect(200);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Action' })])
    );
  });
});