import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ClassSerializerInterceptor, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create user's profile
   *
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    try {
      return this.usersService.create(createUserDto);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get the all user's profile.
   *
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll() {
    try {
      return this.usersService.findAll();
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get the currently authenticated user's profile.
   *
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.usersService.findOne(id);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update the current user's profile.
   *
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.usersService.update(id, updateUserDto);
    } catch (error:any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete the currently authenticated user's profile.
   *
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.usersService.remove(id);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 