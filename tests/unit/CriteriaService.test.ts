import CriteriaService from '../../src/services/CriteriaService';
import CriteriaRepository from '../../src/repositories/CriteriaRepository';

describe('CriteriaService', () => {
  const fake = {
    getCriteriasForUser: jest.fn(),
    saveCriteriasForUser: jest.fn(),
  } as unknown as CriteriaRepository;

  it('getSelectedGenresForUser returns only genres', async () => {
    (fake.getCriteriasForUser as any).mockResolvedValue({ genres: [{id:1}], providers: [{id:2}] });
    const s = new CriteriaService(fake);
    const out = await s.getSelectedGenresForUser('u@mail.tld');
    expect(out).toEqual([{id:1}]);
  });

  it('getSelectedProvidersForUser returns only providers', async () => {
    (fake.getCriteriasForUser as any).mockResolvedValue({ genres: [{id:1}], providers: [{id:2}] });
    const s = new CriteriaService(fake);
    const out = await s.getSelectedProvidersForUser('u@mail.tld');
    expect(out).toEqual([{id:2}]);
  });

  it('saveCriteriasForUser proxies to repository', async () => {
    const s = new CriteriaService(fake);
    await s.saveCriteriasForUser('u@mail.tld', [1,2], [3,4]);
    expect((fake.saveCriteriasForUser as any)).toHaveBeenCalledWith('u@mail.tld', [1,2], [3,4]);
  });
});