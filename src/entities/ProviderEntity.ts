import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "provider_entity" })
export class ProviderEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", unique: true })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    logoUrl!: string;

    @Column({ type: "int", nullable: true, unique: true })
    tmdbId!: number | null;

    @ManyToMany(() => UserEntity, (user) => user.selectedProviders)
    selectedByUsers!: UserEntity[];
}
