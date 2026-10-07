import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

// 🧠 WHAT IS AppModule?
// This is the ROOT module — the top of the module tree.
// NestJS starts here and discovers everything else from the imports list.
//
// Compare to Express server.ts:
//   app.use(cors(...))
//   app.use(express.json())
//   app.use('/api', apiRouter)
//   connectDB()
//
// In NestJS, the "app.use()" equivalents are modules imported here.
// Each module handles its own setup internally.
//
// 🧠 Adding a new feature later (e.g. Movies)?
// Step 1: Create MoviesModule
// Step 2: Add MoviesModule to imports here
// That's it — everything else is self-contained in MoviesModule.

@Module({
  imports: [
    // 🧠 ConfigModule.forRoot({ isGlobal: true })
    // Loads your .env file and makes ConfigService available EVERYWHERE.
    // isGlobal: true means you don't need to import ConfigModule in every module.
    //
    // Compare to Express: require('dotenv').config() in main.ts
    ConfigModule.forRoot({ isGlobal: true }),

    // 🧠 MongooseModule.forRootAsync()
    // Connects to MongoDB. The "root" connection — shared across all modules.
    // forRootAsync() waits for ConfigService to load .env before connecting.
    //
    // Compare to Express src/config/db.ts:
    //   mongoose.connect(process.env.MONGO_URI)
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    // 🧠 AuthModule
    // Import the auth feature. NestJS registers its controller, service, and routes.
    // Compare to Express: app.use('/api', apiRouter) where apiRouter had authRouter
    AuthModule,
  ],
})
export class AppModule {}
