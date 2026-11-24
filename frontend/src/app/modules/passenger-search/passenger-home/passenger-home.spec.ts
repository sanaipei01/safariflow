import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { PassengerSearchModule } from '../passenger-search-module';
import { RouteSummary } from '../models/route-match.model';
import { RouteSearchService } from '../services/route-search.service';
import { greetingFor, PassengerHome } from './passenger-home';

describe('greetingFor', () => {
  it.each([
    [6, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ])("at %i o'clock says %s", (hour, greeting) => {
    expect(greetingFor(hour)).toBe(greeting);
  });
});

const thikaRoad: RouteSummary = {
  routeId: 1,
  routeName: 'Thika Road',
  routeNumber: '237',
  fare: 100,
  stops: ['CBD', 'Githurai', 'Thika'],
};

describe('PassengerHome', () => {
  async function render(popular: RouteSummary[] = [thikaRoad]) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [PassengerSearchModule],
      providers: [
        provideRouter([]),
        {
          provide: RouteSearchService,
          useValue: { stages: () => of(['CBD', 'Thika']), popular: () => of(popular) },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PassengerHome);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const submit = async (from: string, to: string) => {
      fixture.componentInstance.form.setValue({ from, to });
      page.querySelector('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    const click = async (selector: string) => {
      page.querySelector<HTMLButtonElement>(selector)!.click();
      await fixture.whenStable();
    };
    return { page, navigate, submit, click };
  }

  it('asks where the passenger is going', async () => {
    const { page } = await render();

    expect(page.querySelector('h1')?.textContent).toBe('Where are you going?');
  });

  it('lists the popular routes and opens one from its first stage to its last', async () => {
    const { page, navigate, click } = await render();

    const route = page.querySelector('.popular .item')?.textContent;
    expect(route).toContain('237');
    expect(route).toContain('Thika Road');
    expect(route).toContain('CBD to Thika');
    expect(route).toContain('KES 100');

    await click('.popular .item');

    expect(navigate).toHaveBeenCalledWith(['/passenger/find'], {
      queryParams: { from: 'CBD', to: 'Thika' },
    });
  });

  it('shows no popular section when there are no routes', async () => {
    const { page } = await render([]);

    expect(page.querySelector('.popular')).toBeNull();
  });

  it('opens the results for the chosen stages', async () => {
    const { navigate, submit } = await render();

    await submit('CBD', 'Thika');

    expect(navigate).toHaveBeenCalledWith(['/passenger/find'], {
      queryParams: { from: 'CBD', to: 'Thika' },
    });
  });

  it('asks for both stages and does not accept the same one twice', async () => {
    const { page, navigate, submit } = await render();

    await submit('', 'Thika');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Choose where you are leaving from',
    );

    await submit('CBD', 'CBD');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('two different stages');
    expect(navigate).not.toHaveBeenCalled();
  });
});
