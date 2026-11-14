import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { Role } from './common/enums/role.enum';
import { UsersService } from './modules/users/users.service';

// Development accounts only. Never use these passwords in a real deployment.
const DEV_PASSWORD = 'Password123!';

const SEED_USERS = [
  { name: 'System Admin', email: 'admin@safariflow.test', role: Role.ADMIN },
  { name: 'Demo Driver', email: 'driver@safariflow.test', role: Role.DRIVER },
  {
    name: 'Demo Passenger',
    email: 'passenger@safariflow.test',
    role: Role.PASSENGER,
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  for (const seedUser of SEED_USERS) {
    if (await usersService.findByEmail(seedUser.email)) {
      console.log(`Skipped ${seedUser.email} (already exists)`);
      continue;
    }
    await usersService.create({ ...seedUser, phone: null, passwordHash });
    console.log(`Created ${seedUser.role}: ${seedUser.email}`);
  }

  await app.close();
}

void seed();
