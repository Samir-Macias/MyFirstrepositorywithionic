import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { Product, ProductsResponse } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

addIcons({ moonOutline, sunnyOutline });

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export class ProductosPage implements OnInit {
  private productService = inject(ProductService);
  products: Product[] = [];
  total = 0;
  loading = false;
  error = '';

  currentPage = 1;
  pageSize = 6;
  readonly primaryColor = '#7c4dff';

  isDark = false;

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.products.length / this.pageSize));
  }

  ngOnInit(): void {
    this.applyTheme(this.isDark);
    this.loadProducts();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.applyTheme(this.isDark);
  }

  applyTheme(isDark: boolean): void {
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);

    const primaryColor = isDark ? '#7c4dff' : '#2f6fed';
    const secondaryColor = isDark ? '#161b2d' : '#eef3ff';
    const backgroundColor = isDark ? '#0d1117' : '#f4f7fb';
    const textColor = isDark ? '#f5f7ff' : '#1d2736';
    const mutedColor = isDark ? '#b8c0d9' : '#5b687a';
    const toolbarBackground = isDark ? '#161b2d' : '#ffffff';
    const toolbarText = isDark ? '#f5f7ff' : '#1d2736';

    document.documentElement.style.setProperty('--ion-color-primary', primaryColor);
    document.documentElement.style.setProperty('--ion-background-color', backgroundColor);
    document.documentElement.style.setProperty('--ion-text-color', textColor);
    document.documentElement.style.setProperty('--app-toolbar-background', toolbarBackground);
    document.documentElement.style.setProperty('--app-toolbar-text', toolbarText);
    document.documentElement.style.setProperty('--app-surface', secondaryColor);
    document.documentElement.style.setProperty('--app-muted', mutedColor);
  }

  changePage(direction: number): void {
    const nextPage = this.currentPage + direction;
    if (nextPage >= 1 && nextPage <= this.totalPages) {
      this.currentPage = nextPage;
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    this.productService.getProducts().subscribe({
      next: (response: ProductsResponse) => {
        this.products = response.products;
        this.total = response.total;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.error = 'No se han podido cargar los productos.';
        this.loading = false;
      },
    });
  }
}
