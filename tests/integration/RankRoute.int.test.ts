import express from 'express';
import request from 'supertest';
import rankRouter from '../../src/routes/RankRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { UserEntity } from '../../src/entities/UserEntity';
import { GroupEntity } from '../../src/entities/GroupEntity';
import { FilmEntity } from '../../src/entities/FilmEntity';

describe('RankRoute (integration)', () => {
  let user: UserEntity;
  let group: GroupEntity;
  let film: FilmEntity;

  beforeAll(async () => {
    process.env.DB_PATH=':memory:';
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const uRepo = AppDataSource.getRepository(UserEntity);
    const gRepo = AppDataSource.getRepository(GroupEntity);
    const fRepo = AppDataSource.getRepository(FilmEntity);

    film = await fRepo.save(fRepo.create({  id: 1,
        title: 'A',
        overview: '...',
        imageUrl: null,
        releaseDate: null,
        genresId: '',
        popularity: 100,
        voteAverage: 7,
        voteCount: 10, }));
    group = await gRepo.save(gRepo.create({ name: 'G1' }));
    user = await uRepo.save(uRepo.create({ email: 'r@t.t', password: 'x', group }));

  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  function makeAppWithAuthUser() {
    const app = express();
    app.use(express.json());
    // fake middleware to set req.user
    app.use((req, _res, next) => { (req as any).user = { id: user.id }; next(); });
    app.use('/rank', rankRouter);
    return app;
  }

  it('POST /rank records group priority and user vote', async () => {
    const app = makeAppWithAuthUser();
    const res = await request(app)
      .post('/rank')
      .send({ filmId: film.id, delta: 1 })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.delta).toBe(1);
  });
});