import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment } from '../models/comments';

@Injectable({
    providedIn: 'root'
})
export class Comments {
    private http = inject(HttpClient);
    private apiUrl = 'https://jsonplaceholder.typicode.com/comments';
    getComments(): Observable<Comment[]> {
        return this.http.get<Comment[]>(this.apiUrl);
    }
}
