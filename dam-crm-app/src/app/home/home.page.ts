import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItemSliding,
  IonItem,
  IonLabel,
} from '@ionic/angular';
import { SupabaseService } from '../services/supabase';
import { ProveedorModel } from '../models/proveedor.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItemSliding, IonItem, IonLabel],
})
export class HomePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  proveedores: ProveedorModel[] = [];

  async ngOnInit(): Promise<void> {
    this.proveedores = await this.supabaseService.getProveedores();
  }
}
