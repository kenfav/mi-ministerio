import React, { useState, useEffect } from 'react';
import { IonModal, IonButton, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: number) => void;
  currentHours: number;
  monthDisplay: string;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, currentHours, monthDisplay }) => {
  const [hours, setHours] = useState(currentHours);
  const [studies, setStudies] = useState(0); // Mantenemos el estado para la UI calcada
  const [kilometers, setKilometers] = useState(0);

  // Sincronizar si cambia desde afuera
  useEffect(() => {
    setHours(currentHours);
  }, [currentHours, isOpen]);

  const handleSave = () => {
    onSave(hours);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.5} breakpoints={[0, 0.5, 0.7]} className="goal-modal">
      <div style={{ background: 'white', height: '100%', borderRadius: '15px 15px 0 0', padding: '20px', color: 'black' }}>
        
        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          {monthDisplay}
        </div>

        {/* Fila de Horas */}
        <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
          <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setHours(h => Math.max(0, h - 1))} />
          <IonLabel style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>Hours (hh:mm)</div>
            <div style={{ fontSize: '18px' }}>{hours}</div>
          </IonLabel>
          <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setHours(h => h + 1)} />
        </IonItem>

        {/* Fila de Estudios (Estético como en el video) */}
        <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
          <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setStudies(s => Math.max(0, s - 1))} />
          <IonLabel style={{ textAlign: 'center', color: studies > 0 ? 'black' : '#888' }}>
            {studies > 0 ? studies : 'Individual studies'}
          </IonLabel>
          <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setStudies(s => s + 1)} />
        </IonItem>

        {/* Fila de Kilómetros (Estético) */}
        <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
          <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setKilometers(k => Math.max(0, k - 1))} />
          <IonLabel style={{ textAlign: 'center', color: kilometers > 0 ? 'black' : '#888' }}>
            {kilometers > 0 ? kilometers : 'Kilometers'}
          </IonLabel>
          <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setKilometers(k => k + 1)} />
        </IonItem>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 20px' }}>
          <IonButton fill="clear" color="success" onClick={onClose}>CANCEL</IonButton>
          <IonButton fill="clear" color="success" onClick={handleSave}>SET GOALS</IonButton>
        </div>
      </div>
    </IonModal>
  );
};