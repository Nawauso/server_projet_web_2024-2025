import { AuthService } from '../../src/services/AuthService';
import { AppDataSource } from '../../src/AppDataSource';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

(AppDataSource as any).getRepository = jest.fn().mockReturnValue(mockRepo);

describe('AuthService.login', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (AppDataSource.getRepository as any).mockReturnValue(mockRepo);
  });

  it('issues a token when credentials are valid', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token123');

    const token = await AuthService.login('a@b.com', 'pw');
    expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'hashed');
    expect(jwt.sign).toHaveBeenCalled();
    expect(token).toBe('token123');
  });

  it('throws when user not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(AuthService.login('no@b.com', 'pw')).rejects.toThrow('Utilisateur non trouvé');
  });

  it('throws when password invalid', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(AuthService.login('a@b.com', 'pw')).rejects.toThrow();
  });
});

describe('AuthService.userExists', () => {
  it('returns true when user exists', async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1 });
    const exists = await AuthService.userExists('x@y.z');
    expect(exists).toBe(true);
  });
  it('returns false when user does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const exists = await AuthService.userExists('x@y.z');
    expect(exists).toBe(false);
  });
});