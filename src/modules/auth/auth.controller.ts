import { Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    try {
      return this.authService.register(registerDto);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST); 
    }
  }
} 