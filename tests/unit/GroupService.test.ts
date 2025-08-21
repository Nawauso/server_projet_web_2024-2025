import { GroupService } from '../../src/services/GroupService';
import { AppDataSource } from '../../src/AppDataSource';

const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};
const mockGroupRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((x)=>x),
};

(AppDataSource as any).getRepository = jest.fn((entity: any) => {
  if (entity.name === 'UserEntity') return mockUserRepo;
  if (entity.name === 'GroupEntity') return mockGroupRepo;
  return {};
}) as any;

describe('GroupService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getUserGroup returns group & members', async () => {
    mockUserRepo.findOne.mockResolvedValue({
      id: 1,
      group: { id: 10, name: 'Team', user: [{id:1},{id:2}] }
    });
    const out = await GroupService.getUserGroup(1);
      expect(out.inGroup).toBe(true);
      expect(out.group?.name).toBe('Team');
  });

  it('joinGroup associates user to existing group', async () => {
    mockGroupRepo.findOne.mockResolvedValue({ id: 10, name: 'Team' });
    mockUserRepo.findOne.mockResolvedValue({ id: 1 });
    const grp = await GroupService.joinGroup(1, 'Team');
    expect(grp.name).toBe('Team');
    expect(mockUserRepo.save).toHaveBeenCalled();
  });
});