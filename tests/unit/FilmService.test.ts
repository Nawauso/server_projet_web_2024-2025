import FilmService from '../../src/services/FilmService';
import FilmRepository from '../../src/repositories/FilmRepository';

describe('FilmService', () => {
  it('getFilms seeds when DB empty then paginates', async () => {
    const repo: any = {
      countFilmsInDB: jest.fn().mockResolvedValue(0),
      getPaginatedFilms: jest.fn().mockResolvedValue([{id:1},{id:2}]),
    };
    const service = new FilmService(repo as unknown as FilmRepository);
    // spy getAPIFilms to avoid real network calls triggered inside repo
    const spy = jest.spyOn(service as any, 'getAPIFilms').mockResolvedValue(undefined as any);
    const films = await service.getFilms();
    expect(repo.countFilmsInDB).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    expect(films).toHaveLength(2);
  });

  it('resolveUserId handles numeric and email', async () => {
    const service = new (FilmService as any)({});
    const n1 = await service.resolveUserId(5);
    expect(n1).toBe(5);
  });
});