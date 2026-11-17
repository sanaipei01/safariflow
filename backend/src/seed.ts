import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Role } from './common/enums/role.enum';
import { Sacco } from './modules/saccos/entities/sacco.entity';
import { UsersService } from './modules/users/users.service';

// Development data only. Never use these passwords in a real deployment.
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

const SEED_SACCOS = [
  { name: 'Super Metro', registrationNumber: 'SAC/001' },
  { name: 'Metro Trans', registrationNumber: 'SAC/002' },
  { name: 'Embassava', registrationNumber: 'SAC/003' },
];

async function seedUsers(app: INestApplicationContext) {
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
}

async function seedSaccos(app: INestApplicationContext) {
  const saccos = app.get(DataSource).getRepository(Sacco);

  for (const seedSacco of SEED_SACCOS) {
    if (await saccos.existsBy({ name: seedSacco.name })) {
      console.log(`Skipped SACCO ${seedSacco.name} (already exists)`);
      continue;
    }
    await saccos.save(saccos.create({ ...seedSacco, phone: null }));
    console.log(`Created SACCO: ${seedSacco.name}`);
  }
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await seedUsers(app);
  await seedSaccos(app);
  await app.close();
}

void seed();
