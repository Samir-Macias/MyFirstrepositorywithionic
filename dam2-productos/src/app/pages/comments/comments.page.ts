import { Component, OnInit, inject } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { Comments } from '../../services/comments.service';
import { Comment as CommentItem } from '../../models/comments';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

addIcons({ moonOutline, sunnyOutline });

@Component({
  selector: 'app-comments',
  templateUrl: './comments.page.html',
  styleUrls: ['./comments.page.scss'],
  imports: [IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar]
})
export class CommentsPage implements OnInit {
  private commentService = inject(Comments);
  comments: CommentItem[] = [];
  total = 0;
  error = '';

  readonly primaryColor = '#7c4dff';
  isDark = false;

  ngOnInit(): void {
    this.applyTheme(this.isDark);
    this.loadComments();
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

  loadComments(): void {
    this.error = '';
    this.commentService.getComments().subscribe({
      next: (response) => {
        this.comments = response;
        this.total = response.length;
      },
      error: (error) => {
        console.error(error);
        this.error = 'No se han podido cargar los comentarios.';
      },
    });
  }
}
