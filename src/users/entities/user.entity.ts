import { Exclude } from 'class-transformer';
import { RefreshToken } from 'src/auth/entities';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

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

    /**
     * Khi xoá user thì cũng xoá luôn refresh token của user đó bằng onDelete: 'CASCADE'
     */
    @OneToOne(() => RefreshToken, refreshToken => refreshToken.user, { cascade: true, onDelete: 'CASCADE' })
        refreshToken: RefreshToken;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
