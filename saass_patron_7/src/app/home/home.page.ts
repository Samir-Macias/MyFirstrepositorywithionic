import { Component } from '@angular/core';
import { IonContent, IonButton, IonImg } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, IonButton, IonImg],
})
export class HomePage {
  constructor() {}
}
