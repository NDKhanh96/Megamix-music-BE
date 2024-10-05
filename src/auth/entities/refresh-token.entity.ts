import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
