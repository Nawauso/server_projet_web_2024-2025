import express from 'express';
import request from 'supertest';
import userRouter from '../../src/routes/UserRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { UserEntity } from '../../src/entities/UserEntity';
import { FilmEntity } from '../../src/entities/FilmEntity';
import jwt from 'jsonwebtoken';

describe('UserRoute (integration)', () => {
  let token: string;
  let user: UserEntity;
  let film: FilmEntity;

  beforeAll(async () => {
    process.env.DB_PATH=':memory:';
    process.env.JWT_SECRET='testsecret';
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const uRepo = AppDataSource.getRepository(UserEntity);
    const fRepo = AppDataSource.getRepository(FilmEntity);

    user = await uRepo.save(uRepo.create({ email: 'u@r.t', password: 'x' }));
    film = await fRepo.save(fRepo.create({
        id: 1,
        title: 'A',
        overview: '...',
        imageUrl: null,
        releaseDate: null,
        genresId: '',
        popularity: 100,
        voteAverage: 7,
        voteCount: 10,}));
    token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('POST /users/vote updates liked films', async () => {
    const app = express();
    app.use(express.json());
    app.use('/users', userRouter);

    const res = await request(app)
      .post('/users/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ filmId: film.id, delta: 1 })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.liked).toBe(true);
  });
});