import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-galeria',
  templateUrl: './galeria.component.html',
  styleUrls: ['./galeria.component.scss'],
  imports: [],
})
export class GaleriaComponent  implements OnInit {

  public tituloSection:string = 'My First page with ionic and Angular'
  public description: string = 'This page is the best page with Angular and ionic'
  public rutaImagenLocal='assets/desarrollador-programacion-empleo-ti.jpg'
  constructor() { }

  ngOnInit() {}

}
