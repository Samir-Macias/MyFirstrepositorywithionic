import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './RegistroPage';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    localStorage.removeItem('registroFormData');
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('registroFormData');
    document.documentElement.classList.remove('ion-palette-dark');
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps submission disabled until all fields are valid', () => {
    const submitButton =
      fixture.nativeElement.querySelector('ion-button[type="submit"]');

    expect(component.registroForm.invalid).toBe(true);
    expect(submitButton.disabled).toBe(true);

    component.registroForm.setValue({
      nombre: 'Mateo García',
      email: 'mateo@example.com',
      password: 'Clave123',
      calendario: component.minDate,
    });
    fixture.detectChanges();

    expect(component.registroForm.valid).toBe(true);
    expect(submitButton.disabled).toBe(false);
  });

  it('rejects dates earlier than today', () => {
    component.registroForm.controls['calendario'].setValue('2000-01-01');

    expect(
      component.registroForm.controls['calendario'].hasError('dateBeforeToday'),
    ).toBe(true);
  });

  it('sets today as the minimum date in the date picker', () => {
    const dateInput = fixture.nativeElement.querySelector(
      'ion-input[type="date"]',
    ) as HTMLIonInputElement;

    expect(dateInput.getAttribute('formControlName')).toBe('calendario');
    expect(dateInput.min).toBe(component.minDate);
    component.registroForm.controls['calendario'].setValue(component.minDate);
    expect(
      component.registroForm.controls['calendario'].hasError('dateBeforeToday'),
    ).toBe(false);
  });

  it('stores a bcrypt hash instead of the plain-text password', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    component.registroForm.setValue({
      nombre: 'Mateo García',
      email: 'mateo@example.com',
      password: 'Clave123',
      calendario: component.minDate,
    });

    await component.onSubmit();

    const storedData = JSON.parse(
      localStorage.getItem('registroFormData') ?? '{}',
    );
    expect(storedData).toMatchObject({
      nombre: 'Mateo García',
      email: 'mateo@example.com',
      calendario: component.minDate,
    });
    expect(storedData.password).toBeUndefined();
    expect(storedData.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(await bcrypt.compare('Clave123', storedData.passwordHash)).toBe(true);
    expect(alert).toHaveBeenCalledWith(
      'El formulario se ha enviado correctamente.',
    );
    expect(component.lastSubmittedData()).not.toBeNull();
  });

  it('toggles the dark-mode palette on the document', () => {
    component.toggleDarkMode();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(
      true,
    );

    component.toggleDarkMode();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(
      false,
    );
  });

  it('enables the PDF download after submission and invokes the download', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'ion-button',
    ) as NodeListOf<HTMLIonButtonElement>;
    const downloadButton = Array.from(buttons).find((button) =>
      button.textContent?.includes('Descargar datos enviados en PDF'),
    ) as HTMLIonButtonElement;
    const downloadPdf = vi.spyOn(component, 'downloadPdf');

    expect(downloadButton.disabled).toBe(true);
    component.lastSubmittedData.set({
      nombre: 'Mateo García',
      email: 'mateo@example.com',
      calendario: component.minDate,
    });
    fixture.detectChanges();

    expect(downloadButton.disabled).toBe(false);
    downloadButton.click();

    expect(downloadPdf).toHaveBeenCalledOnce();
  });
});
