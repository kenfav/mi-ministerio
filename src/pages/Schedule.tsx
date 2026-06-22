import React, { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, 
  IonButtons, IonButton, IonCheckbox, IonItem, IonLabel, useIonViewWillEnter
} from '@ionic/react';
import { flagOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths 
} from 'date-fns';
import { getSchedulesByMonth, saveSchedule, getGoal, ScheduleEntry } from '../db';
import { SetTimeModal } from '../components/SetTimeModal';

const Schedule: React.FC = () => {
  // 1. Estado para controlar el mes que estamos viendo
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [goalHours, setGoalHours] = useState(90);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 2. Variables derivadas del estado currentDate
  const monthStr = format(currentDate, 'yyyy-MM');
  const monthDisplay = format(currentDate, 'MMMM yyyy');

  // 3. Cargar datos cuando entramos a la pestaña o cambiamos de mes
  useEffect(() => {
    loadData();
  }, [currentDate]);

  useIonViewWillEnter(() => {
    loadData();
  });

  const loadData = async () => {
    const data = await getSchedulesByMonth(monthStr);
    setSchedules(data);

    const savedGoal = await getGoal(monthStr);
    if (savedGoal) {
      setGoalHours(savedGoal.goalHours);
    } else {
      setGoalHours(90); // Meta por defecto
    }
  };

  // Funciones de navegación
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  // Lógica de dibujo del calendario (se recalcula sola al cambiar currentDate)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const scheduledMinutes = schedules.reduce((acc, curr) => acc + curr.minutes, 0);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowModal(true);
  };

  const handleSaveTime = async (minutes: number, notes: string) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await saveSchedule({ date: dateStr, minutes, notes });
    loadData();
  };

  const getMinutesForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const entry = schedules.find(s => s.date === dateStr);
    return entry ? entry.minutes : 0;
  };

  const formatMinsToH = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0 && m === 0) return '';
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          {/* Navegación en el Header */}
          <IonButtons slot="start">
            <IonButton onClick={handlePrevMonth}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          
          <IonTitle style={{ textAlign: 'center' }}>{monthDisplay}</IonTitle>
          
          <IonButtons slot="end">
            <IonButton onClick={handleNextMonth}>
              <IonIcon icon={chevronForwardOutline} />
            </IonButton>
            <IonButton><IonIcon icon={flagOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="dark" className="ion-padding">
        
        {/* Cabecera de Estadísticas Dinámica */}
        <div style={{ color: 'white', marginBottom: '15px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            Service year {format(currentDate, 'yyyy')}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
            <span>Hours scheduled for {format(currentDate, 'MMMM')}:</span>
            <span style={{ fontWeight: 'bold' }}>{Math.floor(scheduledMinutes / 60)}/{goalHours}h</span>
          </div>
        </div>

        <IonItem lines="none" style={{ '--background': 'transparent', '--color': 'white', padding: 0, margin: 0 }}>
          <IonCheckbox slot="start" color="primary" />
          <IonLabel style={{ fontSize: '14px' }}>Update from actual report</IonLabel>
        </IonItem>

        {/* CALENDARIO */}
        <div style={{ background: '#f5f6f9', borderRadius: '10px', padding: '10px', color: 'black', marginTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '12px', color: '#888', marginBottom: '10px' }}>
            {weekDays.map(d => <div key={d}>{d}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', background: '#e0e0e0', borderTop: '1px solid #e0e0e0', borderLeft: '1px solid #e0e0e0' }}>
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const dayMins = getMinutesForDay(day);
              const isTodayDate = isToday(day);

              return (
                <div key={idx} onClick={() => handleDayClick(day)}
                  style={{ 
                    background: isTodayDate ? '#428cff' : (isCurrentMonth ? 'white' : '#f0f0f0'),
                    color: isTodayDate ? 'white' : (isCurrentMonth ? 'black' : '#ccc'),
                    minHeight: '60px', padding: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{format(day, 'd')}</span>
                  {dayMins > 0 && (
                    <span style={{ color: isTodayDate ? 'white' : '#3880ff', fontSize: '12px', marginTop: 'auto', fontWeight: 'bold' }}>
                      {formatMinsToH(dayMins)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <SetTimeModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          onSave={handleSaveTime}
          selectedDate={selectedDate}
          initialMinutes={selectedDate ? getMinutesForDay(selectedDate) : 0}
        />

      </IonContent>
    </IonPage>
  );
};

export default Schedule;