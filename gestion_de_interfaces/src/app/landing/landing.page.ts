import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { LandingPreviewComponent } from './landing-preview.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  imports: [IonContent, RouterLink, LandingPreviewComponent],
})
export class LandingPage {}
