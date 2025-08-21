import express from 'express';
import request from 'supertest';
import groupRouter from '../../src/routes/GroupRoute';
import { AppDataSource } from '../../src/AppDataSource';
import { UserEntity } from '../../src/entities/UserEntity';
import { GroupEntity } from '../../src/entities/GroupEntity';
import jwt from 'jsonwebtoken';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/groups', groupRouter);
  return app;
}

describe('GroupRoute (integration)', () => {
  let user: UserEntity;
  let token: string;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    process.env.JWT_SECRET = 'testsecret';
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(UserEntity);
    const groupRepo = AppDataSource.getRepository(GroupEntity);
    const group = await groupRepo.save(groupRepo.create({ name: 'DevTeam' }));
    user = await userRepo.save(userRepo.create({ email: 'g@t.t', password: 'x', group }));
    token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('GET /groups/my-group returns group info', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/groups/my-group')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.group.name).toBe('DevTeam');
    expect(res.body.membersCount).toBeGreaterThanOrEqual(1);
  });

  it('POST /groups/join attaches user to group', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/groups/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupName: 'DevTeam' })
      .expect(200);
    expect(res.body.group.name).toBe('DevTeam');
  });
});