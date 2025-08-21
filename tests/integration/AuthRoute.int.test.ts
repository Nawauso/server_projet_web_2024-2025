import express from 'express';
import request from 'supertest';
import authRouter from '../../src/routes/AuthRoute';
import { AuthService } from '../../src/services/AuthService';

jest.mock('../../src/services/AuthService');

describe('AuthRoute (integration-light)', () => {
  it('POST /auth/login returns token', async () => {
    (AuthService.login as unknown as jest.Mock).mockResolvedValue('tok');
    const app = express();
    app.use(express.json());
    app.use('/auth', authRouter);

    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'x' }).expect(200);
    expect(res.body).toEqual({ token: 'tok' });
  });
});