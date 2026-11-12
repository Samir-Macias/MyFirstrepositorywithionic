import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { AuthCallbackPage } from './auth-callback.page';

describe('AuthCallbackPage', () => {
  it('navigates to the authenticated destination', async () => {
    const auth = { completeGoogleSignIn: vi.fn().mockResolvedValue('/workspace') };
    TestBed.configureTestingModule({
      imports: [AuthCallbackPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AuthCallbackPage);
    await fixture.componentInstance.ngOnInit();
    expect(navigate).toHaveBeenCalledWith('/workspace', { replaceUrl: true });
  });

  it('shows callback errors with a link back to login', async () => {
    TestBed.configureTestingModule({
      imports: [AuthCallbackPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { completeGoogleSignIn: vi.fn().mockRejectedValue(new Error('Error de prueba')) } },
      ],
    });
    const fixture = TestBed.createComponent(AuthCallbackPage);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Error de prueba');
    expect(page.querySelector('a')?.getAttribute('href')).toBe('/login');
  });
});
