import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

describe('UsersController', (): void => {
    let controller: UsersController;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {},
                }
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });
});
