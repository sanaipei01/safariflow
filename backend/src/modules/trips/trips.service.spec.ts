import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { DriverStatus } from '../drivers/enums/driver-status.enum';
import { Route } from '../routes/entities/route.entity';
import { Trip } from './entities/trip.entity';
import { TripStatus } from './enums/trip-status.enum';
import { TRIP_MAX_HOURS, TripsService } from './trips.service';

const HOUR = 60 * 60_000;
const now = Date.UTC(2026, 10, 24, 12);

const approved = {
  id: 1,
  userId: 10,
  status: DriverStatus.APPROVED,
  vehiclePlate: 'KDA 123A',
  vehicleCapacity: 14,
  saccoName: 'Super Metro',
} as Driver;
const pending = {
  id: 2,
  userId: 20,
  status: DriverStatus.PENDING,
} as Driver;
const thikaRoad = { id: 1, name: 'Thika Road', isActive: true } as Route;
const closedRoute = { id: 2, name: 'Old Route', isActive: false } as Route;

type Condition = Record<string, unknown>;

describe('TripsService', () => {
  let trips: Trip[];
  let service: TripsService;

  const matches = (item: object, condition: Condition) =>
    Object.entries(condition).every(
      ([field, value]) => (item as Condition)[field] === value,
    );

  function runningTrip(overrides: Partial<Trip> = {}): Trip {
    return {
      id: trips.length + 1,
      driverId: approved.id,
      routeId: thikaRoad.id,
      status: TripStatus.ACTIVE,
      startedAt: new Date(now - HOUR),
      endedAt: null,
      ...overrides,
    } as Trip;
  }

  beforeEach(() => {
    trips = [];

    // Minimal in-memory stand-ins for the TypeORM repositories.
    const tripsRepository = {
      create: (data: Partial<Trip>) => runningTrip(data),
      save: async (trip: Trip) => {
        if (!trips.includes(trip)) {
          trips.push(trip);
        }
        return trip;
      },
      find: async ({ where = {} }: { where?: Condition }) =>
        trips
          .filter((trip) => matches(trip, where))
          .map((trip) =>
            Object.assign(trip, {
              route: [thikaRoad, closedRoute].find(
                (r) => r.id === trip.routeId,
              ),
              driver: approved,
            }),
          ),
      findOneOrFail: async ({ where }: { where: Condition }) =>
        Object.assign(
          trips.find((item) => matches(item, where))!,
          {
            route: thikaRoad,
          },
        ),
    };
    const driversRepository = {
      findOneBy: async (condition: Condition) =>
        [approved, pending].find((driver) => matches(driver, condition)) ??
        null,
    };
    const routesRepository = {
      existsBy: async (condition: Condition) =>
        [thikaRoad, closedRoute].some((route) => matches(route, condition)),
      find: async () => [thikaRoad],
    };

    service = new TripsService(
      tripsRepository as unknown as Repository<Trip>,
      driversRepository as unknown as Repository<Driver>,
      routesRepository as unknown as Repository<Route>,
    );
  });

  it('starts a trip for an approved driver', async () => {
    const trip = await service.start(approved.userId, thikaRoad.id, now);

    expect(trip).toMatchObject({
      routeName: 'Thika Road',
      status: TripStatus.ACTIVE,
      endedAt: null,
    });
    expect(trips).toHaveLength(1);
  });

  it('does not let a driver who is not approved start a trip', async () => {
    await expect(
      service.start(pending.userId, thikaRoad.id, now),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.start(999, thikaRoad.id, now)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('only starts trips on routes that exist and are active', async () => {
    await expect(service.start(approved.userId, 99, now)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.start(approved.userId, closedRoute.id, now),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows one trip at a time', async () => {
    trips.push(runningTrip());

    await expect(
      service.start(approved.userId, thikaRoad.id, now),
    ).rejects.toThrow(ConflictException);
  });

  it(`closes a trip left running for ${TRIP_MAX_HOURS} hours so the driver can start again`, async () => {
    const forgotten = runningTrip({
      startedAt: new Date(now - TRIP_MAX_HOURS * HOUR - 1),
    });
    trips.push(forgotten);

    await service.start(approved.userId, thikaRoad.id, now);

    expect(forgotten.status).toBe(TripStatus.COMPLETED);
    expect(trips).toHaveLength(2);
  });

  it('shows the running trip, or nothing when there is none', async () => {
    expect(await service.current(approved.userId, now)).toBeNull();

    trips.push(runningTrip());

    expect(await service.current(approved.userId, now)).toMatchObject({
      routeName: 'Thika Road',
    });
  });

  it('ends the running trip and records when', async () => {
    trips.push(runningTrip());

    const ended = await service.end(approved.userId, now);

    expect(ended.status).toBe(TripStatus.COMPLETED);
    expect(ended.endedAt).toEqual(new Date(now));
    expect(await service.current(approved.userId, now)).toBeNull();
  });

  it('cannot end a trip when none is running', async () => {
    await expect(service.end(approved.userId, now)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lists the trips running on each route with the vehicle only', async () => {
    trips.push(
      runningTrip(),
      runningTrip({ routeId: closedRoute.id }),
      runningTrip({ status: TripStatus.COMPLETED }),
      runningTrip({ startedAt: new Date(now - 13 * HOUR) }),
    );

    const running = await service.activeOnRoutes([thikaRoad.id], now);

    expect([...running.keys()]).toEqual([thikaRoad.id]);
    expect(running.get(thikaRoad.id)).toEqual([
      {
        id: 1,
        plate: 'KDA 123A',
        capacity: 14,
        saccoName: 'Super Metro',
        startedAt: new Date(now - HOUR),
      },
    ]);
  });

  it('counts the trips started on each route, finished or not', async () => {
    trips.push(
      runningTrip(),
      runningTrip({ status: TripStatus.COMPLETED }),
      runningTrip({ routeId: closedRoute.id }),
    );

    const counts = await service.startedCounts();

    expect(counts.get(thikaRoad.id)).toBe(2);
    expect(counts.get(closedRoute.id)).toBe(1);
  });

  it('lists the active routes by name', async () => {
    expect(await service.routeOptions()).toEqual([
      { id: 1, name: 'Thika Road' },
    ]);
  });
});
