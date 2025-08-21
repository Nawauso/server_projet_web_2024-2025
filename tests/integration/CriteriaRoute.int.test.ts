import express from 'express';
import request from 'supertest';
import criteriaRouter from '../../src/routes/CriteriaRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { UserEntity } from '../../src/entities/UserEntity';
import { GenreEntity } from '../../src/entities/GenreEntity';
import { ProviderEntity } from '../../src/entities/ProviderEntity';
import jwt from 'jsonwebtoken';

describe('CriteriaRoute (integration)', () => {
  let token: string;
  let user: UserEntity;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.JWT_SECRET = 'testsecret';
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);
    user = userRepo.create({ email: 'u@t.t', password: 'x' });
    await userRepo.save(user);

    const gRepo = AppDataSource.getRepository(GenreEntity);
    const pRepo = AppDataSource.getRepository(ProviderEntity);
    await gRepo.save([gRepo.create({ name: 'Action', tmdbId: 28 }), gRepo.create({ name: 'Drama', tmdbId: 18 })]);
    await pRepo.save([pRepo.create({ name: 'Netflix', tmdbId: 8 }), pRepo.create({ name: 'Prime', tmdbId: 9 })]);

    token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('PUT /criterias/selected sets relations', async () => {
    const app = express();
    app.use(express.json());
    app.use('/criterias', criteriaRouter);

    const res = await request(app)
      .put('/criterias/selected')
      .set('Authorization', `Bearer ${token}`)
      .send({ genreIds: [28], providerIds: [8] })
      .expect(200);

    expect(res.body.message).toMatch(/enregistrés?/i);
  });

  it('GET /criterias/selected returns ids', async () => {
    const app = express();
    app.use('/criterias', criteriaRouter);

    const res = await request(app)
      .get('/criterias/selected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.genres).toEqual(expect.arrayContaining([28]));
    expect(res.body.providers).toEqual(expect.arrayContaining([8]));
  });
});