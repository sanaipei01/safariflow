export interface Trip {
  id: number;
  routeId: number;
  routeName: string;
  status: 'active' | 'completed';
  startedAt: string;
  endedAt: string | null;
}

export interface RouteOption {
  id: number;
  name: string;
}
