import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouteMatch } from '../models/route-match.model';
import { RouteSearchService } from '../services/route-search.service';
import { PassengerSearchModule } from '../passenger-search-module';
import { RouteSearch } from './route-search';

const thikaRoad: RouteMatch = {
  routeId: 1,
  routeName: 'Thika Road',
  routeNumber: '237',
  fare: 100,
  stops: ['CBD', 'Githurai', 'Thika'],
  trips: [],
};

const runningTrip = {
  id: 7,
  plate: 'KDA 123A',
  capacity: 14,
  saccoName: 'Super Metro',
  startedAt: '2026-11-24T09:00:00Z',
};

describe('RouteSearch', () => {
  const search = vi.fn();

  async function render(params: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [PassengerSearchModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(params) } },
        },
        {
          provide: RouteSearchService,
          useValue: { stages: () => of(['CBD', 'Githurai', 'Thika']), search },
        },
      ],
    });
    const fixture = TestBed.createComponent(RouteSearch);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const searchFor = async (from: string, to: string) => {
      fixture.componentInstance.form.setValue({ from, to });
      page.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { fixture, page, searchFor };
  }

  beforeEach(() => {
    localStorage.clear();
    search.mockReset().mockReturnValue(of([thikaRoad]));
  });

  it('shows each route found with its stops in order', async () => {
    const { page, searchFor } = await render();

    await searchFor('CBD', 'Thika');

    expect(search).toHaveBeenCalledWith({ from: 'CBD', to: 'Thika' });
    expect(page.querySelector('.match-header')?.textContent).toContain('Thika Road');
    const stops = Array.from(page.querySelectorAll('.stops li')).map((li) => li.textContent);
    expect(stops).toEqual(['CBD', 'Githurai', 'Thika']);
    expect(page.querySelector('.match-header')?.textContent).toContain('Route 237');
    expect(page.querySelector('.match-header')?.textContent).toContain('KES 100');
  });

  it('lists the matatus running on a route, or says there are none', async () => {
    const { page, searchFor } = await render();

    await searchFor('CBD', 'Thika');
    expect(page.querySelector('.running')?.textContent).toContain('No matatu is running');

    search.mockReturnValue(of([{ ...thikaRoad, trips: [runningTrip] }]));
    await searchFor('CBD', 'Thika');
    const running = page.querySelector('.running')?.textContent;
    expect(running).toContain('1 running now');
    expect(running).toContain('KDA 123A');
    expect(running).toContain('14 seats');
    expect(running).toContain('Super Metro');
  });

  it('searches straight away for the stages the Home page sent', async () => {
    const { page } = await render({ from: 'CBD', to: 'Thika' });

    expect(search).toHaveBeenCalledWith({ from: 'CBD', to: 'Thika' });
    expect(page.querySelector('.match-header')?.textContent).toContain('Thika Road');
  });

  it('says so when no route connects the stages', async () => {
    search.mockReturnValue(of([]));
    const { page, searchFor } = await render();

    await searchFor('Thika', 'CBD');

    expect(page.textContent).toContain('No route runs from Thika to CBD');
  });

  it('does not search from a stage to itself', async () => {
    const { page, searchFor } = await render();

    await searchFor('CBD', 'CBD');

    expect(search).not.toHaveBeenCalled();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('two different stages');
  });

  it('swaps the two stages', async () => {
    const { fixture, page } = await render();
    fixture.componentInstance.form.setValue({ from: 'CBD', to: 'Thika' });

    page.querySelector<HTMLButtonElement>('button[aria-label="Swap From and To"]')!.click();

    expect(fixture.componentInstance.form.getRawValue()).toEqual({ from: 'Thika', to: 'CBD' });
  });

  it('remembers recent searches and runs one again when it is chosen', async () => {
    const { page, searchFor } = await render();
    await searchFor('CBD', 'Thika');
    search.mockClear();

    page.querySelector<HTMLButtonElement>('.recent button')!.click();

    expect(page.querySelector('.recent button')?.textContent).toContain('CBD to Thika');
    expect(search).toHaveBeenCalledWith({ from: 'CBD', to: 'Thika' });
  });

  it('shows the server message when the search fails', async () => {
    search.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 400, error: { message: 'Choose two different stages' } }),
      ),
    );
    const { page, searchFor } = await render();

    await searchFor('CBD', 'Thika');

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Choose two different stages',
    );
  });
});
