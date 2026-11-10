import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';

import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

import './About.css'

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Blank</IonTitle>
            
          </IonToolbar>
        </IonHeader>
        <ExploreContainer />
        <div style={{ padding: '20px', marginTop: '20px' }}>
          <IonButton expand="block" routerLink="/new-client" color="success">
            <IonIcon slot="start" icon={addCircleOutline}></IonIcon>
            Nuevo Cliente
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
