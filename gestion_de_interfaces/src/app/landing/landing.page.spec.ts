import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  it('is the public root and links to the existing authentication pages', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter(routes)],
    }).compileComponents();

    const rootRoute = routes.find((route) => route.path === '');
    expect(await rootRoute?.loadComponent?.()).toBe(LandingPage);

    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toContain('Más avances');
    expect(page.querySelectorAll('a[href="/login"]').length).toBeGreaterThan(0);
    expect(page.querySelectorAll('a[href="/register"]').length).toBeGreaterThan(0);
    expect(routes.find((route) => route.path === 'home')?.redirectTo).toBe('workspace');
  });
});
