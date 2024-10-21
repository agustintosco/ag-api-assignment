import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { UserService } from './user.service';
import { User } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let userModelMock: typeof User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User),
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModelMock = module.get<typeof User>(getModelToken(User));
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const user = { id: 1, name: 'Angela', balance: 100 };
      (userModelMock.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.findByIdOrFail(1);
      expect(result).toEqual(user);
      expect(userModelMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      (userModelMock.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByIdOrFail(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, name: 'John', balance: 100 }];
      const limit = 10;
      const offset = 0;

      (userModelMock.findAll as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll({ limit, offset });
      expect(result).toEqual(users);
      expect(userModelMock.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBalance', () => {
    it('should return the balance of a user', async () => {
      const balance = { balance: 100 };
      (userModelMock.findOne as jest.Mock).mockResolvedValue(balance);

      const result = await service.getBalance(1);
      expect(result).toBe(100);
      expect(userModelMock.findOne).toHaveBeenCalledWith({
        attributes: ['balance'],
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      (userModelMock.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getBalance(1)).rejects.toThrow(NotFoundException);
    });
  });
});
