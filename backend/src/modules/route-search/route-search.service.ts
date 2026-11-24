import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../routes/entities/route.entity';

export interface RouteMatch {
  routeId: number;
  routeName: string;
  /** The stops from the origin to the destination, both included. */
  stops: string[];
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Routes that reach `to` after `from`, shortest ride first. */
export function matchRoutes(
  routes: Route[],
  from: string,
  to: string,
): RouteMatch[] {
  const matches: RouteMatch[] = [];
  for (const route of routes) {
    const names = route.stages.map((stage) => stage.name);
    const start = names.findIndex((name) => same(name, from));
    const end = names.findIndex((name) => same(name, to));
    if (start !== -1 && end > start) {
      matches.push({
        routeId: route.id,
        routeName: route.name,
        stops: names.slice(start, end + 1),
      });
    }
  }
  return matches.sort(
    (a, b) =>
      a.stops.length - b.stops.length || a.routeName.localeCompare(b.routeName),
  );
}

@Injectable()
export class RouteSearchService {
  constructor(
    @InjectRepository(Route)
    private readonly routesRepository: Repository<Route>,
  ) {}

  /** Every stage on an active route, once each, for the search boxes. */
  async stages(): Promise<string[]> {
    const names = new Map<string, string>();
    for (const route of await this.activeRoutes()) {
      for (const { name } of route.stages) {
        names.set(name.toLowerCase(), name);
      }
    }
    return [...names.values()].sort((a, b) => a.localeCompare(b));
  }

  async search(from: string, to: string): Promise<RouteMatch[]> {
    if (same(from, to)) {
      throw new BadRequestException('Choose two different stages');
    }
    return matchRoutes(await this.activeRoutes(), from, to);
  }

  private activeRoutes(): Promise<Route[]> {
    return this.routesRepository.find({
      where: { isActive: true },
      relations: { stages: true },
      order: { stages: { sequence: 'ASC' } },
    });
  }
}
