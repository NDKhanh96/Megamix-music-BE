import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { genSalt, hash } from 'bcrypt';
import type { UpdateUserDto } from 'src/users/dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities';
import type { Repository, UpdateResult } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
    ) {}


    /**
     * Cần thêm {isCredential?: boolean} để dành cho trường hợp đăng nhập bằng google.
     * Tuy nhiên CreateUserDto còn dùng để validate, mà ta thì không muốn đăng nhập credential có thể gửi cả isCredential,
     * vậy nên kiểu dữ liệu phải là CreateUserDto & {isCredential?: boolean}
     */
    async create(userDTO: CreateUserDto & {isCredential?: boolean}): Promise<User> {
        const emailExists: User | null = await this.userRepository.findOne({ where: { email: userDTO.email } });

        if (emailExists) {
            throw new ConflictException('Email already exists');
        }
        const salt: string = await genSalt();

        userDTO.password = await hash(userDTO.password, salt);

        return await this.userRepository.save(userDTO);
    }

    findOneById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    findOneByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async update(email: string, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
        return this.userRepository.update({ email }, updateUserDto);
    }

    async updateSecretKey(userId: number, secret: string): Promise<UpdateResult> {
        return this.userRepository.update(
            { id: userId },
            { appMFASecret: secret, enableAppMFA: true },
        );
    }

    async disableAppMFA(userId: number): Promise<UpdateResult> {
        return this.userRepository.update(
            { id: userId },
            { appMFASecret: undefined, enableAppMFA: false },
        );
    }
}
