import { Repository } from 'typeorm';
import { Route } from '../routes/entities/route.entity';
import { Stage } from '../routes/entities/stage.entity';
import { matchRoutes, RouteSearchService } from './route-search.service';

function buildRoute(id: number, name: string, stages: string[]): Route {
  return {
    id,
    name,
    isActive: true,
    stages: stages.map((stage, index) => ({
      name: stage,
      sequence: index + 1,
    })) as Stage[],
  } as Route;
}

const thika = buildRoute(1, 'Thika Road', ['CBD', 'Githurai', 'Thika']);
const express = buildRoute(2, 'Thika Express', ['CBD', 'Thika']);
const westlands = buildRoute(3, 'Westlands', ['CBD', 'Westlands']);

describe('matchRoutes', () => {
  it('returns the stops between the two stages, shortest ride first', () => {
    const matches = matchRoutes([thika, express, westlands], 'CBD', 'Thika');

    expect(matches.map((match) => match.routeName)).toEqual([
      'Thika Express',
      'Thika Road',
    ]);
    expect(matches[1].stops).toEqual(['CBD', 'Githurai', 'Thika']);
  });

  it('only matches in the direction the route travels', () => {
    expect(matchRoutes([thika], 'Thika', 'CBD')).toEqual([]);
  });

  it('ignores capital letters and finds stages in the middle of a route', () => {
    const matches = matchRoutes([thika], 'githurai', 'THIKA');

    expect(matches[0].stops).toEqual(['Githurai', 'Thika']);
  });

  it('finds nothing when a stage is not on the route', () => {
    expect(matchRoutes([thika], 'CBD', 'Westlands')).toEqual([]);
  });
});

describe('RouteSearchService', () => {
  let routes: Route[];
  let query: unknown;
  const service = new RouteSearchService({
    find: async (options: unknown) => {
      query = options;
      return routes;
    },
  } as unknown as Repository<Route>);

  beforeEach(() => {
    routes = [thika, westlands];
    query = null;
  });

  it('lists each stage once, in alphabetical order', async () => {
    routes = [thika, express];

    expect(await service.stages()).toEqual(['CBD', 'Githurai', 'Thika']);
  });

  it('only looks at active routes', async () => {
    await service.search('CBD', 'Thika');

    expect(query).toMatchObject({ where: { isActive: true } });
  });

  it('refuses a search from a stage to itself', async () => {
    await expect(service.search('CBD', 'cbd')).rejects.toThrow(
      'Choose two different stages',
    );
  });
});
