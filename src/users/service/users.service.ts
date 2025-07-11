import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userExisting = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (userExisting) {
      throw new BadRequestException('User already exists');
    }

    const saltOrRounds = 10;
    const hashPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashPassword,
    });
    Logger.log('Usuário criado com sucesso: ', user);

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const update = Object.assign(user, updateUserDto);

    Logger.log('Usuário atualizado com sucesso', user.id);

    return this.userRepository.save(update);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    Logger.log('Usuário removido com sucesso: ', user.id);

    await this.userRepository.remove(user);
  }
}
