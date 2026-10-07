import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonGrid, 
  IonRow, 
  IonCol 
} from '@ionic/angular';
import { ProductsService } from '../../services/products';
import { Product } from '../../models/product.interface';

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
    IonCol
  ]
})
export class ProductosPage implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductsService) {}

  async ngOnInit() {
    this.products = await this.productService.getProducts();
  }
}