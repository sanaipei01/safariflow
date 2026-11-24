import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { PassengerSearchModule } from '../passenger-search-module';
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

describe('PassengerHome', () => {
  async function render() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [PassengerSearchModule],
      providers: [
        provideRouter([]),
        { provide: RouteSearchService, useValue: { stages: () => of(['CBD', 'Thika']) } },
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
    return { page, navigate, submit };
  }

  it('asks where the passenger is going', async () => {
    const { page } = await render();

    expect(page.querySelector('h1')?.textContent).toBe('Where are you going?');
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
