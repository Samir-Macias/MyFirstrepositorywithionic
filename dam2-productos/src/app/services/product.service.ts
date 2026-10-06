import { Observable } from "rxjs/internal/Observable";
import { ProductsResponse } from "../models/product.model";
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = 'https://dummyjson.com/products';
    getProducts(): Observable<ProductsResponse> {
        return this.http.get<ProductsResponse>(this.apiUrl);
    }
}
