import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    document.documentElement.dataset['theme'] =
      localStorage.getItem('taskflow-theme') === 'dark' ? 'dark' : 'light';
  }
}
