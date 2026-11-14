import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Welcome } from './welcome';
import { WelcomeModule } from './welcome-module';

describe('Welcome', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WelcomeModule],
      providers: [provideRouter([])],
    });
  });

  it('links to login, the guest route search and registration', () => {
    const fixture = TestBed.createComponent(Welcome);
    fixture.detectChanges();

    const links = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/auth/login',
      '/routes',
      '/auth/register',
    ]);
  });
});
