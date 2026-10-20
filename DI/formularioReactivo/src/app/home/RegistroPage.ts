import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import * as bcrypt from 'bcryptjs';
import { jsPDF } from 'jspdf';

interface SubmittedRegistration {
  nombre: string;
  email: string;
  calendario: string;
}

interface StoredRegistration extends SubmittedRegistration {
  passwordHash: string;
}

interface RegistrationControls {
  nombre: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  calendario: FormControl<string>;
}

const REGISTRATION_STORAGE_KEY = 'registroFormData';

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notBeforeToday(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' &&
    value !== '' &&
    value < getLocalDateString(new Date())
    ? { dateBeforeToday: true }
    : null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'RegistroPage.html',
  styleUrls: ['RegistroPage.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    ReactiveFormsModule,
  ],
})
export class HomePage {
  private readonly fb = inject(NonNullableFormBuilder);
  public readonly minDate = getLocalDateString(new Date());
  public readonly registroForm: FormGroup<RegistrationControls>;
  public readonly isSubmitting = signal(false);
  public readonly isDarkMode = signal(false);
  public readonly lastSubmittedData = signal<SubmittedRegistration | null>(null);

  constructor() {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
        ],
      ],
      calendario: ['', [Validators.required, notBeforeToday]],
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  public async onSubmit(): Promise<void> {
    if (this.registroForm.invalid || this.isSubmitting()) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      const { nombre, email, calendario, password } =
        this.registroForm.getRawValue();
      const passwordHash = await this.hashPassword(password);
      const submittedData: SubmittedRegistration = {
        nombre,
        email,
        calendario,
      };
      const storedData: StoredRegistration = {
        ...submittedData,
        passwordHash,
      };

      localStorage.setItem(
        REGISTRATION_STORAGE_KEY,
        JSON.stringify(storedData),
      );
      this.lastSubmittedData.set(submittedData);
      this.registroForm.reset();
      window.alert('El formulario se ha enviado correctamente.');
    } catch (error) {
      console.error('No se pudo completar el registro.', error);
      window.alert(
        'No se pudo completar el registro. Comprueba el almacenamiento del navegador e inténtalo de nuevo.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public toggleDarkMode(): void {
    const enabled = !this.isDarkMode();
    this.isDarkMode.set(enabled);
    document.documentElement.classList.toggle('ion-palette-dark', enabled);
  }

  public downloadPdf(): void {
    const data = this.lastSubmittedData();
    if (!data) {
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Datos del registro', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Nombre: ${data.nombre}`, 20, 40);
    pdf.text(`Correo electrónico: ${data.email}`, 20, 50);
    pdf.text(`Fecha: ${data.calendario}`, 20, 60);
    pdf.save(`registro-${data.calendario}.pdf`);
  }
}