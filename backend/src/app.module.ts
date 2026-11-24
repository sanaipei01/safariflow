import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { MatatusModule } from './modules/matatus/matatus.module';
import { RouteSearchModule } from './modules/route-search/route-search.module';
import { RoutesModule } from './modules/routes/routes.module';
import { SaccosModule } from './modules/saccos/saccos.module';
import { TripsModule } from './modules/trips/trips.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_DATABASE', 'safariflow.db'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    UsersModule,
    AuthModule,
    SaccosModule,
    MatatusModule,
    DriversModule,
    RoutesModule,
    RouteSearchModule,
    TripsModule,
  ],
})
export class AppModule {}
