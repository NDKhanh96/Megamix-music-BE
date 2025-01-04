import { User } from 'src/users/entities';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        userId: number;

    @Column()
        token: string;

    @Column()
        expiresAt: Date;

    @OneToOne(() => User, (user => user.refreshToken))
        user: User;
}
