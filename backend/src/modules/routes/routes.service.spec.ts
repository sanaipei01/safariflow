import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { Stage } from './entities/stage.entity';
import { RoutesService } from './routes.service';

function buildStages(names: string[]): Stage[] {
  return names.map(
    (name, index) => ({ id: index + 1, name, sequence: index + 1 }) as Stage,
  );
}

function buildRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 1,
    name: 'Nairobi - Thika',
    isActive: true,
    stages: buildStages(['Nairobi CBD', 'Githurai', 'Thika']),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Route;
}

const stageNames = (route: Route) => route.stages.map((stage) => stage.name);

describe('RoutesService', () => {
  let routes: Route[];
  let service: RoutesService;

  beforeEach(() => {
    routes = [buildRoute()];

    // Minimal in-memory stand-in for the TypeORM repository.
    const routesRepository = {
      findOneBy: async ({ name }: { name: string }) =>
        routes.find((route) => route.name === name) ?? null,
      findOne: async ({ where }: { where: { id: number } }) =>
        routes.find((route) => route.id === where.id) ?? null,
      find: async () => routes,
      create: (data: Partial<Route>) => data as Route,
      save: async (route: Route) => {
        if (!route.id) {
          route.id = routes.length + 1;
          routes.push(route);
        }
        return route;
      },
      remove: async (route: Route) => {
        routes = routes.filter((item) => item.id !== route.id);
      },
    } as unknown as Repository<Route>;

    service = new RoutesService(routesRepository);
  });

  describe('create', () => {
    it('saves a route with its stages numbered in the order given', async () => {
      const route = await service.create({
        name: 'Nairobi - Nakuru',
        stages: ['Nairobi CBD', 'Naivasha', 'Nakuru'],
      });

      expect(stageNames(route)).toEqual(['Nairobi CBD', 'Naivasha', 'Nakuru']);
      expect(route.stages.map((stage) => stage.sequence)).toEqual([1, 2, 3]);
    });

    it('rejects a route name that is already used', async () => {
      await expect(
        service.create({ name: 'Nairobi - Thika', stages: ['A', 'B'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a route that lists the same stage twice, ignoring capitals', async () => {
      await expect(
        service.create({
          name: 'Loop',
          stages: ['Thika', 'Githurai', 'thika'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns the route with its stages', async () => {
      const route = await service.findOne(1);

      expect(stageNames(route)).toEqual(['Nairobi CBD', 'Githurai', 'Thika']);
    });

    it('fails for a route that does not exist', async () => {
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('changes only the fields that were sent', async () => {
      const route = await service.update(1, { isActive: false });

      expect(route.isActive).toBe(false);
      expect(route.name).toBe('Nairobi - Thika');
      expect(stageNames(route)).toEqual(['Nairobi CBD', 'Githurai', 'Thika']);
    });

    it('replaces the whole list of stages and renumbers them', async () => {
      const route = await service.update(1, {
        stages: ['Thika', 'Githurai', 'Nairobi CBD', 'Westlands'],
      });

      expect(stageNames(route)).toEqual([
        'Thika',
        'Githurai',
        'Nairobi CBD',
        'Westlands',
      ]);
      expect(route.stages.map((stage) => stage.sequence)).toEqual([1, 2, 3, 4]);
    });

    it('lets a route keep its own name', async () => {
      await expect(
        service.update(1, { name: 'Nairobi - Thika' }),
      ).resolves.toBeDefined();
    });

    it('rejects a name that belongs to another route', async () => {
      routes.push(buildRoute({ id: 2, name: 'Nairobi - Nakuru' }));

      await expect(
        service.update(1, { name: 'Nairobi - Nakuru' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects duplicate stages in the new list', async () => {
      await expect(
        service.update(1, { stages: ['Thika', 'Thika'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('fails for a route that does not exist', async () => {
      await expect(service.update(99, { isActive: false })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the route', async () => {
      await service.remove(1);

      expect(routes).toHaveLength(0);
    });

    it('fails for a route that does not exist', async () => {
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
