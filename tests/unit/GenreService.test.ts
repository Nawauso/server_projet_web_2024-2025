import GenreService from '../../src/services/GenreService';
import GenreRepository from '../../src/repositories/GenreRepository';
import { Genre } from '../../src/models/Genre';

class FakeRepo implements Partial<GenreRepository> {
  data: Genre[] = [new (Genre as any)(1, 'Action')];
  async getGenres(): Promise<Genre[]> { return this.data; }
}

describe('GenreService', () => {
  it('returns genres', async () => {
    const repo = new FakeRepo();
    const s = new GenreService(repo as any);
    const result = await s.getGenres();
    expect(result).toHaveLength(1);
  });
  it('throws when empty', async () => {
    const repo = new FakeRepo();
    repo.data = [];
    const s = new GenreService(repo as any);
    await expect(s.getGenres()).rejects.toThrow('Genres not found');
  });
});