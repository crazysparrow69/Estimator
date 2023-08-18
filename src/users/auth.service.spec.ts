import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  const users: User[] = [];

  beforeEach(async () => {
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter(user => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = { id: Math.floor(Math.random() * 999999), email, password } as User;
        users.push(user);
        return Promise.resolve(user);
      }
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it("creates a new user with a salted and hashed password", async () => {
    const user = await service.signup("asdf1@asdf1.com", "asdf");

    expect(user.password).not.toEqual("asdf");
    const [salt, hash] = user.password.split(".");
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asdf2@asdf2.com', 'asdf');
    await expect(service.signup('asdf2@asdf2.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(service.signin('asdf3@asdf3.com', 'asdf')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('asdf4@asdf4.com', 'asdf');
    await expect(service.signin('asdf4@asdf4.com', 'asdd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if valid password is provided', async () => {
    await service.signup("asd@asd.com", "asd");
    const user = await service.signin('asd@asd.com', 'asd');
    expect(user).toBeDefined();
  });
});
