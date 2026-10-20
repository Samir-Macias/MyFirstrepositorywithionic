import { Component, OnInit, inject } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonButtons
} from '@ionic/angular';
import { ProductsService } from '../../services/products';
import { Product } from '../../models/product.interface';
import { IonBackButton } from '@ionic/angular/ion-back-button';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonGrid, 
    IonRow, 
    IonCol,
    IonButtons,
    IonBackButton
  ]
})
export class ProductosPage implements OnInit {
  products: Product[] = [];

  private readonly productService = inject(ProductsService);

  async ngOnInit() {
    this.products = await this.productService.getProducts();
  }
}