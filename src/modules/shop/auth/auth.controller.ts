import { Controller, Get, Res, Req, UseGuards, HttpStatus, Post, Body } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './utils/guards.utils';
import { AuthGuard } from '@nestjs/passport';
import { GetClient } from './decorators/get-client.decorator';
import { ClientData, ClientDataLogin } from 'src/interfaces';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoginAuthClientDto } from './dto/login-auth-client.dto';

@ApiTags('Auth Client')
@Controller({ path: 'auth/client', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google/login')
  handleLogin(@Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email%20profile&access_type=offline&prompt=consent`;
    return res.redirect(googleAuthUrl);
  }

  @ApiOkResponse({ description: 'Client authenticated successfully' })
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req: Request, @Res() res: Response) {
    if (req.user) {
      const { user } = req;
      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Client authenticated successfully',
        data: user
      });
    } else {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Authentication failed'
      });
    }
  }

  @ApiOkResponse({ description: 'Client profile' })
  @Get('profile')
  @UseGuards(AuthGuard('client-jwt'))
  getClientProfile(@GetClient() client: ClientData) {
    return client;
  }

  @ApiOkResponse({ description: 'Client authenticated successfully' })
  @Post('login')
  async login(@Body() loginAuthClientDto: LoginAuthClientDto): Promise<ClientDataLogin> {
    return this.authService.login(loginAuthClientDto);
  }
}
