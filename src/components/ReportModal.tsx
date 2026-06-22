import React, { useState, useEffect } from 'react';
import { 
  IonModal, IonButton, IonIcon, IonItem, IonInput, IonLabel, IonDatetime
} from '@ionic/react';
import { 
  addCircleOutline, removeCircleOutline, timeOutline, caretDownOutline 
} from 'ionicons/icons';
import { format, parseISO } from 'date-fns';
import { TimeNumpad } from './TimeNumpad';
import { saveReport, updateReport, ReportEntry } from '../db';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: ReportEntry | null;
  initialMinutes?: number; 
}
export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, editEntry, initialMinutes = 0 }) => {
  const [date, setDate] = useState(new Date());
  const [minutes, setMinutes] = useState(0);
  const [studies, setStudies] = useState(0);
  const [kilometers, setKilometers] = useState(0);
  const [comment, setComment] = useState('');
  
  const [showNumpad, setShowNumpad] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // EFECTO: Si recibimos un editEntry, cargamos sus datos en el estado
  useEffect(() => {
    if (editEntry) {
      setDate(parseISO(editEntry.date));
      setMinutes(editEntry.minutes);
      setStudies(editEntry.studies);
      setKilometers(editEntry.kilometers);
      setComment(editEntry.comment);
    } else {
      setDate(new Date());
      setMinutes(initialMinutes); 
      setStudies(0);
      setKilometers(0);
      setComment('');
    }
  }, [editEntry, initialMinutes, isOpen]);

  const displayTime = minutes > 0 
    ? `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}`
    : 'Hours (hh:mm)';

  const handleSave = async () => {
    const reportData = {
      date: format(date, 'yyyy-MM-dd'),
      minutes,
      studies,
      kilometers,
      comment
    };

    if (editEntry && editEntry.id) {
      // MODO EDICIÓN
      await updateReport({ ...reportData, id: editEntry.id });
    } else {
      // MODO CREACIÓN
      await saveReport(reportData);
    }
    
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.7} breakpoints={[0, 0.7, 0.9]}>
        <div style={{ background: 'white', height: '100%', borderRadius: '15px 15px 0 0', padding: '20px', color: 'black' }}>
          
          <div 
            onClick={() => setShowDatePicker(true)}
            style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {format(date, 'MMMM d, yyyy')} <IonIcon icon={caretDownOutline} />
          </div>

          <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
            <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setMinutes(m => Math.max(0, m - 60))} />
            <IonLabel onClick={() => setShowNumpad(true)} style={{ textAlign: 'center', color: minutes > 0 ? 'black' : '#888' }}>{displayTime}</IonLabel>
            <IonIcon icon={timeOutline} slot="end" color="primary" onClick={() => setShowNumpad(true)} />
            <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setMinutes(m => m + 60)} />
          </IonItem>

          <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
            <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setStudies(s => Math.max(0, s - 1))} />
            <IonLabel style={{ textAlign: 'center', color: studies > 0 ? 'black' : '#888' }}>{studies > 0 ? studies : 'Individual studies'}</IonLabel>
            <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setStudies(s => s + 1)} />
          </IonItem>

          <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black' }}>
            <IonIcon icon={removeCircleOutline} slot="start" color="primary" onClick={() => setKilometers(k => Math.max(0, k - 1))} />
            <IonLabel style={{ textAlign: 'center', color: kilometers > 0 ? 'black' : '#888' }}>{kilometers > 0 ? kilometers : 'Kilometers'}</IonLabel>
            <IonIcon icon={addCircleOutline} slot="end" color="primary" onClick={() => setKilometers(k => k + 1)} />
          </IonItem>

          <IonItem lines="full" style={{ '--background': 'transparent', '--color': 'black', marginTop: '10px' }}>
            <IonInput placeholder="Comment" value={comment} onIonChange={e => setComment(e.detail.value!)} />
          </IonItem>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '0 20px' }}>
            <IonButton fill="clear" color="success" onClick={onClose}>CANCEL</IonButton>
            <IonButton fill="clear" color="success" onClick={handleSave}>
              {editEntry ? 'UPDATE' : 'ADD'}
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)} initialBreakpoint={0.6} breakpoints={[0, 0.6]}>
        <div style={{ background: 'white', height: '100%', padding: '10px' }}>
          <IonDatetime presentation="date" value={date.toISOString()} onIonChange={e => {
            setDate(new Date(e.detail.value as string));
            setShowDatePicker(false);
          }} />
        </div>
      </IonModal>

      <TimeNumpad isOpen={showNumpad} onClose={() => setShowNumpad(false)} onSave={(mins) => { setMinutes(mins); setShowNumpad(false); }} />
    </>
  );
};