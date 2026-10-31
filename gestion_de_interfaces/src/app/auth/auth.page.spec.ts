import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { AuthPage } from './auth.page';

describe('AuthPage', () => {
  let component: AuthPage;
  let fixture: ComponentFixture<AuthPage>;
  let auth: { signUp: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { signUp: vi.fn().mockResolvedValue(false) };

    await TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              routeConfig: { path: 'register' },
              queryParamMap: { get: vi.fn().mockReturnValue(null) },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submits registration without depending on an email-check RPC', async () => {
    component.authForm.setValue({
      fullName: 'Usuario Nuevo',
      email: 'nuevo@example.test',
      password: 'secure-password',
    });

    await component.submit();

    expect(auth.signUp).toHaveBeenCalledWith(
      'nuevo@example.test',
      'secure-password',
      'Usuario Nuevo',
    );
    expect(component.noticeMessage()).toContain('Si la cuenta puede registrarse');
  });
});
