import { AppDataSource } from '../AppDataSource';
import { UserEntity } from '../entities/UserEntity';
import { GroupEntity } from '../entities/GroupEntity';

export class GroupService {
    static async getUserGroup(userId: number) {
        const userRepository = AppDataSource.getRepository(UserEntity);

        const user = await userRepository.findOne({
            where: { id: userId },
            relations: ['group', "group.user"], // Charge la relation avec le groupe
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé.");
        }

        if (!user.group) {
            return { inGroup: false };
        }

        return { inGroup: true, group: user.group };
    }

    static async createGroup(userId: number, groupName: string) {
        const groupRepository = AppDataSource.getRepository(GroupEntity);
        const userRepository = AppDataSource.getRepository(UserEntity);

        // Vérifie si un groupe avec ce nom existe déjà
        const existingGroup = await groupRepository.findOne({ where: { name: groupName } });
        if (existingGroup) {
            throw new Error("Le nom du groupe est déjà utilisé.");
        }

        // Crée un nouveau groupe
        const newGroup = groupRepository.create({ name: groupName });
        await groupRepository.save(newGroup);

        // Associe l'utilisateur au groupe
        const user = await userRepository.findOne({ where: { id: userId } });
        if (user) {
            user.group = newGroup; // Associe directement le groupe
            await userRepository.save(user);
        }

        return newGroup;
    }

    static async joinGroup(userId: number, groupName: string) {
        const groupRepository = AppDataSource.getRepository(GroupEntity);
        const userRepository = AppDataSource.getRepository(UserEntity);

        // Vérifie si le groupe existe
        const group = await groupRepository.findOne({ where: { name: groupName } });
        if (!group) {
            throw new Error("Le groupe n'existe pas.");
        }

        // Associe l'utilisateur au groupe
        const user = await userRepository.findOne({ where: { id: userId } });
        if (user) {
            user.group = group; // Associe directement le groupe
            await userRepository.save(user);
        }

        return group;
    }
}
