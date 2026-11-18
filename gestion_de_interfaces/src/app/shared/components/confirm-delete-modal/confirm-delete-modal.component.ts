import { Component, OnInit, HostListener, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonContent, IonModal, IonText, IonSpinner, IonHeader, IonToolbar, IonTitle, IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { ionicAlertOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

/**
 * Modal de confirmación accesible para eliminación de recursos
 * Implementa:
 * - aria-labels para screen readers
 * - Navegación por teclado (ESC para cancelar, Enter para confirmar)
 * - Indicador visual de carga
 * - Roles ARIA apropiados
 */
@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent,
    IonModal,
    IonText,
    IonSpinner,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon
  ],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrls: ['./confirm-delete-modal.component.scss']
})
export class ConfirmDeleteModalComponent implements OnInit {
  resourceName: string = '';
  resourceId: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private modalController: ModalController,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    addIcons({ ionicAlertOutline });
  }

  ngOnInit() {
    // Recibir datos pasados al modal
    const data = this.modalController.animated;
    if (data) {
      this.resourceName = (data as any).resourceName || 'recurso';
      this.resourceId = (data as any).resourceId || '';
    }

    // Configurar focus trap y keyboard handling
    this.setupKeyboardHandlers();
    this.setupFocusTrap();
  }

  /**
   * Maneja eventos de teclado para accesibilidad
   * - ESC: cierra modal
   * - Enter: confirma eliminación (si botón Eliminar tiene focus)
   */
  private setupKeyboardHandlers(): void {
    this.renderer.listen(this.el.nativeElement, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.onCancel();
      }
      
      // Enter en botón confirmar
      if (event.key === 'Enter' && !this.isLoading) {
        const confirmButton = this.el.nativeElement.querySelector('[aria-label="Confirmar eliminación"]');
        if (confirmButton === document.activeElement) {
          this.onConfirm();
        }
      }
    });
  }

  /**
   * Implementa focus trap dentro del modal
   * El focus no puede salir del modal mientras esté abierto
   */
  private setupFocusTrap(): void {
    const focusableElements = this.el.nativeElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      this.renderer.listen(this.el.nativeElement, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
              event.preventDefault();
              (lastFocusable as HTMLElement).focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              event.preventDefault();
              (firstFocusable as HTMLElement).focus();
            }
          }
        }
      });

      // Set initial focus
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }

  /**
   * Listener global para ESC key (respaldo)
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (!this.isLoading) {
      this.onCancel();
    }
  }

  /**
   * Cancela la operación y cierra el modal
   */
  async onCancel(): Promise<void> {
    await this.modalController.dismiss(null, 'cancel');
  }

  /**
   * Confirma la eliminación
   * El componente padre debe escuchar el evento y realizar la eliminación
   */
  async onConfirm(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // El componente padre manejará la eliminación real
      // Aquí solo emitimos que fue confirmado
      await this.modalController.dismiss(
        { confirmed: true, resourceId: this.resourceId },
        'confirm'
      );
    } catch (err) {
      this.isLoading = false;
      this.error = `Error: ${err instanceof Error ? err.message : 'Desconocido'}`;
      
      // Anunciar error para screen readers
      this.announceToScreenReader(this.error);
    }
  }

  /**
   * Anuncia mensajes a screen readers usando aria-live region
   */
  private announceToScreenReader(message: string): void {
    const liveRegion = this.el.nativeElement.querySelector('[aria-live="polite"]');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }
}
