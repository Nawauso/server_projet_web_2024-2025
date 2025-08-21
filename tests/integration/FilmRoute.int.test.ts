import express from 'express';
import request from 'supertest';
import filmRouter from '../../src/routes/FilmRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { FilmEntity } from '../../src/entities/FilmEntity';

describe('FilmRoute (integration)', () => {
  beforeAll(async () => {
    process.env.DB_PATH=':memory:';
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(FilmEntity);
    await repo.save(repo.create({
        id: 1,
        title: 'A',
        overview: '...',
        imageUrl: null,
        releaseDate: null,
        genresId: '',
        popularity: 100,
        voteAverage: 7,
        voteCount: 10,
    }));
      await repo.save(repo.create({
          id: 2,
          title: 'B',
          overview: '...',
          imageUrl: null,
          releaseDate: null,
          genresId: '',
          popularity: 100,
          voteAverage: 7,
          voteCount: 10,
      }));
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('GET /films/home returns a paginated feed shape', async () => {
    const app = express();
    app.use((req, _res, next) => { (req as any).user = { id: 1 }; next(); });
    app.use('/films', filmRouter);

    const res = await request(app).get('/films/home?limit=1').expect(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBe(1);
  });
});