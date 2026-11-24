/** A matatu running on a route right now. */
export interface ActiveTrip {
  id: number;
  plate: string;
  capacity: number;
  saccoName: string | null;
  startedAt: string;
}

export interface RouteMatch {
  routeId: number;
  routeName: string;
  /** From the origin to the destination, both included. */
  stops: string[];
  trips: ActiveTrip[];
}

export interface SearchQuery {
  from: string;
  to: string;
}
