import { PrimaryGeneratedColumn, Column, Entity} from "typeorm";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    email!: string

    @Column()
    firstname!: string

    @Column()
    lastname!: string

    @Column()
    password!: string

    @Column()
    phone!: string

}