export interface RouteStage {
  id: number;
  name: string;
  sequence: number;
}

export interface MatatuRoute {
  id: number;
  name: string;
  routeNumber: string | null;
  /** The usual fare for the whole route, in Kenya shillings. */
  fare: number | null;
  isActive: boolean;
  /** In travel order: the first stage is the origin and the last is the destination. */
  stages: RouteStage[];
}

export interface SaveRouteRequest {
  name: string;
  routeNumber: string | null;
  fare: number | null;
  isActive: boolean;
  stages: string[];
}
