import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importación recomendada para proyectos Standalone
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({ moonOutline, sunnyOutline });

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonButton, 
    IonButtons, 
    IonContent, 
    IonHeader, 
    IonIcon, 
    IonTitle, 
    IonToolbar, 
    RouterLink
  ],
})
export class InicioPage implements OnInit {
  isDark = false;

  constructor() { }

  ngOnInit() {
    this.applyTheme(this.isDark);
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.applyTheme(this.isDark);
  }

  private applyTheme(isDark: boolean): void {
    // 1. Conmutar clases de tema en el body
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);

    // 2. Definir los colores para primario, fondo y texto
    const primaryColor = isDark ? '#7c4dff' : '#3880ff';
    const backgroundColor = isDark ? '#121212' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';

    // 3. Modificar las variables CSS globales
    document.documentElement.style.setProperty('--ion-color-primary', primaryColor);
    document.documentElement.style.setProperty('--ion-background-color', backgroundColor);
    document.documentElement.style.setProperty('--ion-text-color', textColor);
  }
}
