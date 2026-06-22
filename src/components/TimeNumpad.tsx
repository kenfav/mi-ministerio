import React, { useState, useEffect } from 'react';
import { IonModal, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/react';
import { backspaceOutline } from 'ionicons/icons';

interface TimeNumpadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

export const TimeNumpad: React.FC<TimeNumpadProps> = ({ isOpen, onClose, onSave }) => {
  const [timeStr, setTimeStr] = useState('');

  // Limpiar el teclado cada vez que se abre
  useEffect(() => {
    if (isOpen) setTimeStr('');
  }, [isOpen]);

  const handleKeyPress = (key: string) => {
    if (timeStr.length < 5) { // Límite razonable (ej. 99:59)
      setTimeStr((prev) => prev + key);
    }
  };

  const handleBackspace = () => {
    setTimeStr((prev) => prev.slice(0, -1));
  };

  const handleOk = () => {
    // Convertir "1:50" a minutos reales (1 * 60 + 50 = 110)
    let totalMinutes = 0;
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0] || '0', 10);
      const mins = parseInt(parts[1] || '0', 10);
      totalMinutes = (hours * 60) + mins;
    } else {
      // Si solo puso "1" sin dos puntos, asumimos que es 1 hora
      totalMinutes = parseInt(timeStr || '0', 10) * 60;
    }
    onSave(totalMinutes);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ':'];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="numpad-modal">
      <div style={{ background: '#222', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Pantalla del Teclado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#333', fontSize: '32px', color: 'white', alignItems: 'center' }}>
          <span>{timeStr || 'hh:mm'}</span>
          <IonIcon icon={backspaceOutline} onClick={handleBackspace} style={{ color: '#888' }} />
        </div>

        {/* Botones del Teclado */}
        <IonGrid style={{ flex: 1, padding: '20px' }}>
          <IonRow>
            {keys.map((k, idx) => (
              <IonCol size="4" key={idx} style={{ textAlign: 'center', padding: '10px' }}>
                {k !== '' && (
                  <button 
                    onClick={() => handleKeyPress(k)}
                    style={{ background: 'transparent', color: 'white', fontSize: '32px', border: 'none', width: '100%', height: '60px' }}
                  >
                    {k}
                  </button>
                )}
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* Botones Inferiores */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <IonButton fill="clear" color="medium" onClick={onClose}>CANCEL</IonButton>
          <IonButton fill="clear" color="light" onClick={handleOk}>OK</IonButton>
        </div>
      </div>
    </IonModal>
  );
};