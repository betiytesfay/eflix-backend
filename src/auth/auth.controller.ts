import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// 🧠 WHAT IS A CONTROLLER?
// A Controller handles incoming HTTP requests and returns responses.
// It's the equivalent of your Express route handlers + route definitions combined.
//
// In Express you had TWO files for this:
//   auth.routes.ts     → defined the routes (POST /register, GET /me)
//   auth.controller.ts → defined the handler functions
//
// In NestJS, ONE controller class does both with decorators.
//
// 🧠 @Controller('auth')
// Sets the BASE PATH for all routes in this class → /auth
// Combined with the global prefix 'api' set in main.ts → /api/auth
//
// So:
//   @Post('register') → POST /api/auth/register
//   @Post('login')    → POST /api/auth/login
//   @Get('me')        → GET  /api/auth/me

@Controller('auth')
export class AuthController {
  // 🧠 The service is injected by NestJS — we never call new AuthService()
  constructor(private readonly authService: AuthService) {}

  // ──────────────────────────────────────────────
  // POST /api/auth/register
  // ──────────────────────────────────────────────
  // 🧠 @Body() dto: RegisterDto
  // NestJS reads req.body, transforms it into a RegisterDto instance,
  // and runs all the @IsString(), @MinLength() validations automatically.
  // If validation fails → 400 response with error details (no code needed).
  // If validation passes → dto is fully typed and ready to use.
  //
  // Compare to Express:
  //   if (!isUserRegistration(req.body)) { res.status(400)... }
  //   const { phoneNumber, password } = req.body;  ← untyped
  @Post('register')
  register(@Body() dto: RegisterDto) {
    // Delegate ALL logic to the service — controller stays thin
    return this.authService.register(dto);
  }

  // ──────────────────────────────────────────────
  // POST /api/auth/login
  // ──────────────────────────────────────────────
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ──────────────────────────────────────────────
  // GET /api/auth/me  (protected)
  // ──────────────────────────────────────────────
  // 🧠 @UseGuards(JwtAuthGuard)
  // Runs JwtAuthGuard BEFORE this method executes.
  // JwtAuthGuard tells Passport to run the jwt strategy.
  // If token is missing/invalid → 401 returned automatically.
  // If token is valid → req.user is populated from JwtStrategy.validate()
  //
  // Compare to Express:
  //   authRouter.get('/me', protect, getMe)  ← protect is the middleware
  //   Here: @UseGuards(JwtAuthGuard)          ← guard does the same thing
  //
  // 🧠 @Request() req
  // Injects the raw Express request object so we can read req.user
  // NestJS also has @Req() which is an alias for @Request()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: { user: { userId: string; role: string } }) {
    // Extract userId from the decoded JWT payload (set by JwtStrategy.validate())
    // and pass it to the service — the controller doesn't touch the DB
    return this.authService.getMe(req.user.userId);
  }
}
