
import React, { useState, useEffect } from 'react';

import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonFab, 
  IonFabButton, IonButtons, IonButton, useIonViewWillEnter
} from '@ionic/react';

import { 
  playCircle, stopCircle, pauseCircle, add, searchOutline, syncOutline, 
  ellipsisVerticalOutline, informationCircleOutline 
} from 'ionicons/icons';
import { format } from 'date-fns';
import { ReportModal } from '../components/ReportModal';
import { getReportsByMonth, getGoal, exportBackup, importBackup } from '../db';

const Home: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [minutesFromTimer, setMinutesFromTimer] = useState(0);

  const [monthTotals, setMonthTotals] = useState({ minutes: 0, studies: 0, kilometers: 0 });
  const [monthGoal, setMonthGoal] = useState({ hours: 90, profile: 'Special pioneer' });

  // Cargar datos cada vez que se abre la pantalla Home
  useIonViewWillEnter(() => {
    loadDashboardData();
  });

  const loadDashboardData = async () => {
    const monthStr = format(new Date(), 'yyyy-MM');
    
    // Sumar reportes
    const reports = await getReportsByMonth(monthStr);
    let m = 0, s = 0, k = 0;
    reports.forEach(r => { m += r.minutes; s += r.studies; k += r.kilometers; });
    setMonthTotals({ minutes: m, studies: s, kilometers: k });

    // Obtener meta
    const savedGoal = await getGoal(monthStr);
    if (savedGoal) {
      setMonthGoal({ hours: savedGoal.goalHours, profile: savedGoal.profile });
    }
  };

  // Cronómetro lógico
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const stopTimer = () => {
    if (seconds === 0) return; // No hacer nada si no hay tiempo

    setIsActive(false);

    const mins = Math.floor(seconds / 60);
    
    setMinutesFromTimer(mins);
    setShowReportModal(true);
    
    setSeconds(0); 
  };

  // Funciones de formateo
  const formatTimerDisplay = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursDisplay = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}:${m.toString().padStart(2, '0')}h` : `${h}h`;
  };

  // Cálculo para el círculo de progreso
  const goalMinutes = monthGoal.hours * 60;
  const progressPercent = goalMinutes > 0 ? Math.min(100, (monthTotals.minutes / goalMinutes) * 100) : 0;
  
  // Matemáticas para dibujar el círculo SVG (circunferencia = 2 * pi * radio)
  const circleRadius = 24;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (progressPercent / 100) * circleCircumference;
  
  // Constante para archivo de backups
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    try {
      await importBackup(file);
      alert('Backup restored successfully!');
      window.location.reload(); // Recargamos para ver los cambios
    } catch (err) {
      alert('Error restoring backup. Make sure the file is valid.');
    }
  }
};

  return (
        <IonPage>
      {/* ... header ... */}
      <IonContent color="dark" className="ion-padding">
        
        <IonCard style={{ background: '#424242', borderRadius: '8px', margin: '0 0 20px 0' }}>
          <IonCardHeader style={{ paddingBottom: '0' }}>
            <IonCardTitle style={{ fontSize: '18px', color: '#aaaaaa', display: 'flex', justifyContent: 'space-between' }}>
              Service timer
              <IonIcon icon={ellipsisVerticalOutline} />
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '20px' }}>
            
            {/* BOTÓN PLAY / PAUSE DINÁMICO */}
            <IonIcon 
              icon={isActive ? pauseCircle : playCircle} 
              style={{ fontSize: '64px', color: '#3880ff' }} 
              onClick={toggleTimer} 
            />
            
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', minWidth: '80px', textAlign: 'center' }}>
              {formatTimerDisplay(seconds)}
            </div>

            {/* BOTÓN STOP (AHORA GUARDA) */}
            <IonIcon 
              icon={stopCircle} 
              style={{ fontSize: '64px', color: seconds > 0 ? '#eb445a' : '#aaaaaa' }} 
              onClick={stopTimer} 
            />
          </IonCardContent>
        </IonCard>

        {/* TODAY AT A GLANCE */}
        <div style={{ textAlign: 'center', margin: '25px 0', fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: 'white' }}>
          TODAY AT A GLANCE
        </div>

		{/* Enable backups */}
        <IonCard style={{ background: '#424242', borderRadius: '8px', margin: '0 0 20px 0' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#aaaaaa' }}>Backups</IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ color: '#aaaaaa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <div style={{ background: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <IonIcon icon={syncOutline} style={{ color: '#0F9D58', fontSize: '24px' }} />
              </div>
              <span style={{ fontSize: '20px', color: 'white' }}>Manual Backup</span>
            </div>
            Export your data to a file to keep it safe or move it to another device.
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
              {/* BOTÓN RESTAURAR (Importar) */}
              <IonButton fill="clear" color="success" onClick={() => fileInputRef.current?.click()}>
                RESTORE
              </IonButton>
              
              {/* BOTÓN RESPALDAR (Exportar) */}
              <IonButton fill="clear" color="success" onClick={exportBackup}>
                BACKUP NOW
              </IonButton>
            </div>

            {/* Input de archivo oculto */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImport} 
            />
          </IonCardContent>
        </IonCard>

        {/* Monthly hour goal */}
        <IonCard style={{ background: '#424242', borderRadius: '8px', margin: '0 0 20px 0' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#aaaaaa' }}>Monthly hour goal</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Círculo de progreso SVG personalizado */}
              <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Fondo del círculo */}
                  <circle cx="30" cy="30" r={circleRadius} stroke="#666" strokeWidth="6" fill="none" />
                  {/* Progreso del círculo */}
                  <circle cx="30" cy="30" r={circleRadius} stroke="#6a64ff" strokeWidth="6" fill="none" 
                    strokeDasharray={circleCircumference} strokeDashoffset={circleOffset} 
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} 
                  />
                </svg>
                <IonIcon icon={syncOutline} style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '20px', color: '#6a64ff' }} />
              </div>

              <div style={{ fontSize: '36px', color: 'white' }}>
                {formatHoursDisplay(monthTotals.minutes)}
              </div>
            </div>
            <p style={{ marginTop: '10px', color: '#aaaaaa' }}>
              To be on target to reach your goal of {monthGoal.hours} hours this month.
            </p>
          </IonCardContent>
        </IonCard>

        {/* Month report */}
        <IonCard style={{ background: '#424242', borderRadius: '8px', margin: '0 0 80px 0' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#aaaaaa', display: 'flex', justifyContent: 'space-between' }}>
              Month report
              <IonIcon icon={informationCircleOutline} />
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ color: 'white', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#aaaaaa' }}>Hours</span>
              <span>{Math.floor(monthTotals.minutes / 60)}:{(monthTotals.minutes % 60).toString().padStart(2, '0')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#aaaaaa' }}>Studies</span>
              <span>{monthTotals.studies}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#aaaaaa' }}>Kilometers</span>
              <span>{monthTotals.kilometers.toFixed(1)}</span>
            </div>
            <div style={{ marginTop: '15px', color: '#aaaaaa' }}>
              Profile: <span style={{ color: 'white' }}>{monthGoal.profile}</span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Botón Flotante '+' */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '10px', marginRight: '10px' }}>
          <IonFabButton color="success" onClick={() => setShowReportModal(true)}>
            <IonIcon icon={add} style={{ fontSize: '32px' }} />
          </IonFabButton>
        </IonFab>

        {/* Modal de Reporte */}
        <ReportModal 
          isOpen={showReportModal} 
          onClose={() => {
            setShowReportModal(false);
            setMinutesFromTimer(0);
            setSeconds(0); // Reiniciamos el reloj al cerrar/guardar
            loadDashboardData();
          }} 
          initialMinutes={minutesFromTimer}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;