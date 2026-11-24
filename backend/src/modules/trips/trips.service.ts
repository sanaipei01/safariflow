import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { DriverStatus } from '../drivers/enums/driver-status.enum';
import { Route } from '../routes/entities/route.entity';
import { Trip } from './entities/trip.entity';
import { TripStatus } from './enums/trip-status.enum';

/** A trip nobody ended stops counting as running after this long. */
export const TRIP_MAX_HOURS = 12;
const TRIP_MAX_MS = TRIP_MAX_HOURS * 60 * 60_000;

export interface TripView {
  id: number;
  routeId: number;
  routeName: string;
  status: TripStatus;
  startedAt: Date;
  endedAt: Date | null;
}

/** What a passenger may see of a running trip: the vehicle, nothing personal. */
export interface ActiveTrip {
  id: number;
  plate: string;
  capacity: number;
  saccoName: string | null;
  startedAt: Date;
}

const isFresh = (trip: Trip, now: number) =>
  now - new Date(trip.startedAt).getTime() < TRIP_MAX_MS;

const toView = (trip: Trip): TripView => ({
  id: trip.id,
  routeId: trip.routeId,
  routeName: trip.route.name,
  status: trip.status,
  startedAt: trip.startedAt,
  endedAt: trip.endedAt,
});

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly trips: Repository<Trip>,
    @InjectRepository(Driver) private readonly drivers: Repository<Driver>,
    @InjectRepository(Route) private readonly routes: Repository<Route>,
  ) {}

  /** The active routes a driver can choose from. */
  async routeOptions(): Promise<{ id: number; name: string }[]> {
    const routes = await this.routes.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return routes.map(({ id, name }) => ({ id, name }));
  }

  async start(
    userId: number,
    routeId: number,
    now = Date.now(),
  ): Promise<TripView> {
    const driver = await this.drivers.findOneBy({ userId });
    if (driver?.status !== DriverStatus.APPROVED) {
      throw new ForbiddenException('Only approved drivers can start a trip');
    }
    if (!(await this.routes.existsBy({ id: routeId, isActive: true }))) {
      throw new NotFoundException('That route is not available');
    }
    if (await this.currentTrip(driver.id, now)) {
      throw new ConflictException(
        'You already have a trip in progress. End it first',
      );
    }
    const trip = await this.trips.save(
      this.trips.create({ driverId: driver.id, routeId }),
    );
    return toView(await this.findOne(trip.id));
  }

  async current(userId: number, now = Date.now()): Promise<TripView | null> {
    const driver = await this.drivers.findOneBy({ userId });
    const trip = driver && (await this.currentTrip(driver.id, now));
    return trip ? toView(trip) : null;
  }

  async end(userId: number, now = Date.now()): Promise<TripView> {
    const driver = await this.drivers.findOneBy({ userId });
    const trip = driver && (await this.currentTrip(driver.id, now));
    if (!trip) {
      throw new NotFoundException('You have no trip in progress');
    }
    return toView(await this.finish(trip, new Date(now)));
  }

  /** The trips running now on each of the given routes. */
  async activeOnRoutes(
    routeIds: number[],
    now = Date.now(),
  ): Promise<Map<number, ActiveTrip[]>> {
    const running = new Map<number, ActiveTrip[]>();
    const trips = await this.trips.find({
      where: { status: TripStatus.ACTIVE },
      relations: { driver: true },
      order: { startedAt: 'ASC' },
    });
    for (const trip of trips) {
      if (!routeIds.includes(trip.routeId) || !isFresh(trip, now)) {
        continue;
      }
      const { vehiclePlate, vehicleCapacity, saccoName } = trip.driver;
      running.set(trip.routeId, [
        ...(running.get(trip.routeId) ?? []),
        {
          id: trip.id,
          plate: vehiclePlate,
          capacity: vehicleCapacity,
          saccoName,
          startedAt: trip.startedAt,
        },
      ]);
    }
    return running;
  }

  /** The driver's running trip. Any older one that was never ended is closed. */
  private async currentTrip(
    driverId: number,
    now: number,
  ): Promise<Trip | null> {
    const open = await this.trips.find({
      where: { driverId, status: TripStatus.ACTIVE },
      relations: { route: true },
    });
    const current = open.find((trip) => isFresh(trip, now)) ?? null;
    for (const trip of open.filter((item) => item !== current)) {
      await this.finish(
        trip,
        new Date(new Date(trip.startedAt).getTime() + TRIP_MAX_MS),
      );
    }
    return current;
  }

  private async finish(trip: Trip, endedAt: Date): Promise<Trip> {
    trip.status = TripStatus.COMPLETED;
    trip.endedAt = endedAt;
    return this.trips.save(trip);
  }

  private async findOne(id: number): Promise<Trip> {
    return this.trips.findOneOrFail({
      where: { id },
      relations: { route: true },
    });
  }
}
