import { Component, computed, effect, signal, ChangeDetectionStrategy } from
'@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton,
IonIcon, IonBadge } from '@ionic/angular';
// Interfaz para el tipado de datos
export interface Producto {
id: number;
nombre: string;
precio: number;
categoria: string;
}
@Component({
selector: 'app-carrito-signals',
standalone: true,
changeDetection: ChangeDetectionStrategy.OnPush, // Optimización crítica
imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton,
IonIcon, IonBadge],
template: `
<ion-header>
<ion-toolbar color="chartreuse">
<ion-title>Carrito Reactivo</ion-title>
<!-- Lectura de la señal computada en el template usando () -->
<ion-badge slot="end" color="light" class="ion-margin-end">
Total: {{ precioTotal() }}€
</ion-badge>
</ion-toolbar>
</ion-header>
<ion-content>
<ion-list>
<!-- Nuevo Control Flow de Angular -->
@for (prod of productos(); track prod.id) {
<ion-item>
<ion-label>
<h2>{{ prod.nombre }}</h2>
<p>{{ prod.precio }}€</p>
<p>{{ prod.categoria }}</p>
</ion-label>
<ion-button color="chartreuse" fill="clear" (click)="eliminarProducto(prod.id)">
Eliminar
</ion-button>
</ion-item>
} @empty {
<ion-item>
<ion-label class="ion-text-center">El carrito está vacío</ion-label>
</ion-item>
}
</ion-list>
<div class="ion-padding">
<ion-button color="chartreuse" expand="block" (click)="agregarProductoAleatorio()">
Añadir Producto Random
</ion-button>
</div>
</ion-content>
`
})
export class HomePage {
// 1. Estado Writable (WritableSignal)
public productos = signal<Producto[]>([
  { id: 3, nombre: 'Monitor 27" 4K', precio: 350, categoria: 'Hadware' },
  
  { id: 4, nombre: 'Suscripción Cloud API', precio: 29, categoria: 'Software' },
  { id: 5, nombre: 'Ratón Ergonómico', precio: 65, categoria: 'Hadware' },
  { id: 6, nombre: 'Curso de Jetpack Compose', precio: 45, categoria: 'Formación' },
  { id: 7, nombre: 'Auriculares Cancelación Ruido', precio: 199, categoria: 'Hadware' } 


]);
// 2. Estado Derivado (Computed Signal) - Se recalcula solo si 'productos' cambia
public precioTotal = computed(() => {
return this.productos().reduce((total, prod) => total + prod.precio, 0);
});
constructor() {
// 3. Efecto Secundario (Effect) - Se ejecuta en la inicialización y cada vez que 'productos' cambie
effect(() => {
console.log(`[Persistencia] Estado actual del carrito guardado. Items:
${this.productos().length}`);
// Aquí integraríamos Preferences API de Capacitor para persistir localmente
});
}
// Métodos de mutación de estado
public agregarProductoAleatorio(): void {
const nuevoId = Math.floor(Math.random() * 1000) + 3;
const categorias = ['Software', 'Hardware', 'Accesorio'];
const categoriaAleatoria = categorias[Math.floor(Math.random() * categorias.length)];
const nuevoProducto: Producto = {
  id: nuevoId,
  nombre: `Monitor ${nuevoId}`,
  precio: 250,
  categoria: categoriaAleatoria,
};
this.productos.update(estadoAnterior => [...estadoAnterior, nuevoProducto]);
}
public eliminarProducto(id: number): void {
this.productos.update(estadoAnterior => estadoAnterior.filter(p => p.id !== id));
}
}