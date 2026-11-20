export interface RouteStage {
  id: number;
  name: string;
  sequence: number;
}

export interface MatatuRoute {
  id: number;
  name: string;
  isActive: boolean;
  /** In travel order: the first stage is the origin and the last is the destination. */
  stages: RouteStage[];
}

export interface SaveRouteRequest {
  name: string;
  isActive: boolean;
  stages: string[];
}
