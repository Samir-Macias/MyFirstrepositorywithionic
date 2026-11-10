import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

import ExploreContainer from '../components/ExploreContainer';
import './About.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Saludos Teacher</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
       
          <IonToolbar>
            <IonTitle>About</IonTitle>
          </IonToolbar>
   
       
      </IonContent>
    </IonPage>
  );
};

export default Home;
