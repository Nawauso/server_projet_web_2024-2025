import { AppDataSource } from '../AppDataSource';
import { GroupEntity } from '../entities/GroupEntity';

export class GroupRepository {
    private static repository = AppDataSource.getRepository(GroupEntity);

    static findByName(name: string) {
        return this.repository.findOne({ where: { name } });
    }

    static async createGroup(name: string) {
        const group = this.repository.create({ name });
        return await this.repository.save(group);
    }
}
