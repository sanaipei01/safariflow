/** A matatu running on a route right now. */
export interface ActiveTrip {
  id: number;
  plate: string;
  capacity: number;
  saccoName: string | null;
  startedAt: string;
}

export interface RouteSummary {
  routeId: number;
  routeName: string;
  routeNumber: string | null;
  /** The usual fare for the whole route, in Kenya shillings. */
  fare: number | null;
  /** From the origin to the destination, both included. */
  stops: string[];
}

export interface RouteMatch extends RouteSummary {
  trips: ActiveTrip[];
}

export interface SearchQuery {
  from: string;
  to: string;
}
