export interface RouteMatch {
  routeId: number;
  routeName: string;
  /** From the origin to the destination, both included. */
  stops: string[];
}

export interface SearchQuery {
  from: string;
  to: string;
}
