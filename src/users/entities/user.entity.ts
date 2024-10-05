import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        firstName: string;

    @Column()
        lastName: string;

    @Column()
        picture: string;

    @Column()
        email: string;

    @Column()
    @Exclude()
        password: string;

    @Column({ default: '' })
        appMFASecret: string;

    @Column({ default: false, type: 'boolean' })
        enableAppMFA: boolean;

    @Column({ default: true, type: 'boolean' })
        isCredential: boolean;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
