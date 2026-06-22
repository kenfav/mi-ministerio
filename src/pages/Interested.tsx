import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Interested: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Ministry Assistant</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Dashboard Principal</h1>
      </IonContent>
    </IonPage>
  );
};
export default Interested;