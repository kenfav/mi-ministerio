import React, { useState, useEffect } from 'react';
import { IonModal, IonButton, IonInput, IonDatetime, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/react';

interface SetTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number, notes: string) => void;
  selectedDate: Date | null;
  initialMinutes?: number;
}

export const SetTimeModal: React.FC<SetTimeModalProps> = ({ isOpen, onClose, onSave, selectedDate, initialMinutes = 0 }) => {
  const [time, setTime] = useState('00:00');
  const [notes, setNotes] = useState('');

  // Sincronizar el tiempo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const h = Math.floor(initialMinutes / 60);
      const m = initialMinutes % 60;
      setTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      setNotes('');
    }
  }, [isOpen, initialMinutes]);

  const handleSave = () => {
    // Extraemos de forma segura la hora y los minutos sin importar el formato de Ionic
    const parts = time.includes('T') ? time.split('T')[1].substring(0, 5) : time.substring(0, 5);
    const [hours, minutes] = parts.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes;
    
    onSave(totalMinutes, notes);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.9]} className="time-modal">
      <div style={{ background: '#333', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera Fija */}
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': '#333', color: 'white' }}>
            <IonTitle style={{ textAlign: 'center' }}>Set time</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Contenido con Scroll (Esto asegura que los botones siempre se puedan ver) */}
        <IonContent style={{ '--background': '#333', color: 'white' }} className="ion-padding">
          
          {/* Ruleta Selectora de Tiempo (hourCycle="h23" QUITA el AM/PM) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', background: '#222', borderRadius: '10px', padding: '10px' }}>
            <IonDatetime 
              presentation="time" 
              preferWheel={true} 
              hourCycle="h23" 
              value={`2026-06-21T${time}:00`} 
              onIonChange={e => {
                if (e.detail.value) {
                  setTime(e.detail.value as string);
                }
              }}
              style={{ '--background': '#222', color: 'white' }}
            />
          </div>

          {/* Input de Notas */}
          <IonInput 
            placeholder="Notes" 
            value={notes} 
            onIonChange={e => setNotes(e.detail.value!)}
            style={{ background: '#444', borderRadius: '5px', padding: '10px', marginTop: '10px', color: 'white' }}
          />

          {/* Botones de Guardar (Ahora siempre accesibles) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <IonButton fill="clear" color="success" onClick={onClose}>CANCEL</IonButton>
            <IonButton fill="clear" color="success" onClick={handleSave}>SET</IonButton>
          </div>

        </IonContent>
      </div>
    </IonModal>
  );
};