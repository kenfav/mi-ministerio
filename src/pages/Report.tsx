import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonSegment, 
  IonSegmentButton, IonLabel, IonList, IonItem, IonListHeader, 
  IonNote, IonIcon, IonButtons, IonButton, useIonViewWillEnter,
  IonSelect, IonSelectOption, IonItemGroup, IonItemDivider, IonAlert
} from '@ionic/react';
import { 
  shareSocialOutline, ellipsisVerticalOutline, pencilOutline, 
  chevronBackOutline, chevronForwardOutline, bookOutline, locationOutline 
} from 'ionicons/icons';
import { format, getDaysInMonth, getDate, addMonths, subMonths, startOfMonth } from 'date-fns';
import { getReportsByMonth, getGoal, saveGoal, ReportEntry } from '../db';
import { GoalModal } from '../components/GoalModal';
import { ReportModal } from '../components/ReportModal';

const PROFILES = [
  { name: 'Publisher', defaultGoal: 0 },
  { name: 'Bethelite', defaultGoal: 0 },
  { name: 'Auxiliary pioneer (15h)', defaultGoal: 15 },
  { name: 'Auxiliary pioneer (30h)', defaultGoal: 30 },
  { name: 'Regular pioneer', defaultGoal: 50 },
  { name: 'Special pioneer (90h)', defaultGoal: 90 },
  { name: 'Special pioneer (100h)', defaultGoal: 100 },
  { name: 'Circuit overseer', defaultGoal: 0 },
  { name: 'Field missionary (90h)', defaultGoal: 90 },
  { name: 'Field missionary (100h)', defaultGoal: 100 }
];

const Report: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlertMinutes, setShowAlertMinutes] = useState(false);
const [selectedReport, setSelectedReport] = useState<ReportEntry | null>(null);
  const [leftoverMinutes, setLeftoverMinutes] = useState(0);

const handleItemClick = (report: ReportEntry) => {
  setSelectedReport(report);
  setShowEditModal(true);
};

  const [selectedTab, setSelectedTab] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados de datos
  const [dailyReports, setDailyReports] = useState<ReportEntry[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ minutes: 0, studies: 0, kilometers: 0 });
  const [yearData, setYearData] = useState<any[]>([]);
  const [goal, setGoal] = useState({ hours: 90, profile: 'Special pioneer (90h)' });
  
  // Estados de UI
  const [showGoalModal, setShowGoalModal] = useState(false);
  const profileSelectRef = useRef<HTMLIonSelectElement>(null);

  const monthStr = format(currentDate, 'yyyy-MM');
  const monthDisplay = format(currentDate, 'MMMM yyyy');

  // Cargar datos cada vez que cambia el mes o la pestaña
  useEffect(() => {
    loadData();
  }, [currentDate, selectedTab]);

  useIonViewWillEnter(() => {
    loadData();
  });

  const loadData = async () => {
    // 1. CARGAR DATOS PARA DAILY Y MONTH
    const reports = await getReportsByMonth(monthStr);
    
    // DAILY: Ordenamos por fecha descendente (del más nuevo al más viejo)
    const sortedReports = [...reports].sort((a, b) => b.date.localeCompare(a.date));
    setDailyReports(sortedReports);

    // MONTH: Sumatorias
    let m = 0, s = 0, k = 0;
    reports.forEach(r => { m += r.minutes; s += r.studies; k += r.kilometers; });
    setMonthlyTotals({ minutes: m, studies: s, kilometers: k });

    // Cargar Meta y Perfil
    const savedGoal = await getGoal(monthStr);
    if (savedGoal) {
      setGoal({ hours: savedGoal.goalHours, profile: savedGoal.profile });
    }

    // 2. CARGAR DATOS PARA SERVICE YEAR (Septiembre a Agosto)
    if (selectedTab === 'year') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      // El año de servicio empieza en Septiembre (mes 8)
      let startYear = month >= 8 ? year : year - 1;
      
      const monthsOfServiceYear = Array.from({ length: 12 }, (_, i) => {
        return format(addMonths(new Date(startYear, 8, 1), i), 'yyyy-MM');
      });

      const yearResults = await Promise.all(monthsOfServiceYear.map(async (mStr) => {
        const reps = await getReportsByMonth(mStr);
        let mins = 0;
        reps.forEach(r => mins += r.minutes);
        return { month: mStr, totalMinutes: mins };
      }));
      setYearData(yearResults);
    }
  };

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const handleSaveGoal = async (newHours: number) => {
    const newGoalObj = { monthYear: monthStr, profile: goal.profile, goalHours: newHours };
    await saveGoal(newGoalObj);
    setGoal({ hours: newHours, profile: goal.profile });
  };

  const handleProfileChange = async (profileName: string) => {
    const selectedProfile = PROFILES.find(p => p.name === profileName);
    const newHours = selectedProfile?.defaultGoal || 0;
    const newGoalObj = { monthYear: monthStr, profile: profileName, goalHours: newHours };
    await saveGoal(newGoalObj);
    setGoal({ hours: newHours, profile: profileName });
  };

  const formatTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  // Cálculos de metas para la pestaña MONTH
  const goalMinutes = goal.hours * 60;
  const minutesLeft = Math.max(0, goalMinutes - monthlyTotals.minutes);
  const daysInMonth = getDaysInMonth(currentDate);
  const today = format(new Date(), 'yyyy-MM') === monthStr ? getDate(new Date()) : 1;
  const daysLeft = daysInMonth - today + 1;
  const minsPerDayLeft = daysLeft > 0 ? Math.floor(minutesLeft / daysLeft) : 0;
  
   // --- FUNCIÓN COMPARTIR ---
  const handleShare = async () => {
    const hoursOnly = Math.floor(monthlyTotals.minutes / 60);
    const remainingMins = monthlyTotals.minutes % 60;

    const message = `Report for ${monthDisplay}:\nHours: ${hoursOnly}\nStudies: ${monthlyTotals.studies}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Report ${monthDisplay}`,
          text: message
        });

        // Si hay minutos sobrantes, preguntar por el traspaso DESPUÉS de compartir
        if (remainingMins > 0) {
          setLeftoverMinutes(remainingMins);
          setShowAlertMinutes(true);
        }
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert("Sharing not supported in this browser.");
    }
  };

  // --- FUNCIÓN TRASPASAR MINUTOS ---
  const transferMinutes = async () => {
    const nextMonth = startOfMonth(addMonths(currentDate, 1));
    const nextMonthStr = format(nextMonth, 'yyyy-MM-dd');

    await saveReport({
      date: nextMonthStr,
      minutes: leftoverMinutes,
      studies: 0,
      kilometers: 0,
      comment: `Transferred from ${format(currentDate, 'MMMM')}`
    });

    alert(`${leftoverMinutes} minutes transferred to ${format(nextMonth, 'MMMM')}`);
    setLeftoverMinutes(0);
  };
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={handlePrevMonth}><IonIcon icon={chevronBackOutline} /></IonButton>
          </IonButtons>
          <IonTitle style={{ textAlign: 'center' }}>{monthDisplay}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleNextMonth}><IonIcon icon={chevronForwardOutline} /></IonButton>
            <IonButton onClick={handleShare}><IonIcon icon={shareSocialOutline} /></IonButton>
            <IonButton><IonIcon icon={ellipsisVerticalOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar color="primary">
          <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value as string)} style={{ '--background': 'transparent' }}>
            <IonSegmentButton value="daily"><IonLabel style={{ fontSize: '12px' }}>DAILY</IonLabel></IonSegmentButton>
            <IonSegmentButton value="month"><IonLabel style={{ fontSize: '12px' }}>MONTH</IonLabel></IonSegmentButton>
            <IonSegmentButton value="year"><IonLabel style={{ fontSize: '12px' }}>SERVICE YEAR</IonLabel></IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent color="dark">
        
{/* PESTAÑA DAILY */}
{selectedTab === 'daily' && (
  <IonList style={{ background: 'transparent' }}>
    {dailyReports.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No activity recorded for this month.</div>
    ) : (
      dailyReports.map((report) => (
         <IonItem 
            key={report.id} 
            button 
            detail={false} // <--- AÑADE ESTO PARA QUITAR EL '>'
            onClick={() => handleItemClick(report)} 
            style={{ '--background': 'transparent', '--color': 'white' }} 
          >
          <IonLabel>
            <h2 style={{ color: 'white', fontWeight: 'bold' }}>{format(new Date(report.date + 'T00:00:00'), 'eeee, d')}</h2>
            <p style={{ color: '#aaaaaa' }}>{report.comment || 'No comment'}</p>
          </IonLabel>
          <IonNote slot="end" style={{ textAlign: 'right' }}>
            <div style={{ color: '#3880ff', fontSize: '18px', fontWeight: 'bold' }}>{formatTime(report.minutes)}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {report.studies > 0 && <span>{report.studies} <IonIcon icon={bookOutline} /> </span>}
              {report.kilometers > 0 && <span>{report.kilometers} km</span>}
            </div>
          </IonNote>
        </IonItem>
      ))
    )}
  </IonList>
)}

        {/* PESTAÑA MONTH */}
        {selectedTab === 'month' && (
          <div style={{ paddingBottom: '20px' }}>
            <IonList style={{ background: 'transparent' }} lines="none">
              <IonListHeader style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>Ministry</IonListHeader>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Hours</IonLabel>
                <IonNote slot="end" style={{ color: 'white', fontSize: '16px' }}>{formatTime(monthlyTotals.minutes)}</IonNote>
              </IonItem>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Individual studies</IonLabel>
                <IonNote slot="end" style={{ color: 'white', fontSize: '16px' }}>{monthlyTotals.studies}</IonNote>
              </IonItem>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Kilometers</IonLabel>
                <IonNote slot="end" style={{ color: 'white', fontSize: '16px' }}>{monthlyTotals.kilometers.toFixed(1)}</IonNote>
              </IonItem>
            </IonList>

            <IonList style={{ background: 'transparent', marginTop: '15px' }} lines="none">
              <IonListHeader style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>
                Goal for the month
                <IonIcon icon={pencilOutline} style={{ marginLeft: '10px', fontSize: '16px', color: '#888', cursor: 'pointer' }} onClick={() => setShowGoalModal(true)} />
              </IonListHeader>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Hours</IonLabel>
                <IonNote slot="end" style={{ color: 'white', fontSize: '16px' }}>{goal.hours}</IonNote>
              </IonItem>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Hours left to do</IonLabel>
                <IonNote slot="end" style={{ color: 'white', fontSize: '16px' }}>{formatTime(minutesLeft)}</IonNote>
              </IonItem>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>Hours per remaining days</IonLabel>
                <IonNote slot="end" style={{ color: minsPerDayLeft > 120 ? '#eb445a' : 'white', fontSize: '16px' }}>{formatTime(minsPerDayLeft)}</IonNote>
              </IonItem>
            </IonList>

            <IonList style={{ background: 'transparent', marginTop: '15px' }} lines="none">
              <IonListHeader style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>
                Profile
                <IonIcon icon={pencilOutline} style={{ marginLeft: '10px', fontSize: '16px', color: '#888', cursor: 'pointer' }} onClick={() => profileSelectRef.current?.open()} />
              </IonListHeader>
              <IonItem style={{ '--background': 'transparent', '--color': '#aaaaaa' }}>
                <IonLabel>{goal.profile}</IonLabel>
                <IonSelect ref={profileSelectRef} value={goal.profile} onIonChange={e => handleProfileChange(e.detail.value)} style={{ display: 'none' }} interface="action-sheet">
                  {PROFILES.map(p => <IonSelectOption key={p.name} value={p.name}>{p.name}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
            </IonList>
          </div>
        )}

        {/* PESTAÑA SERVICE YEAR */}
        {selectedTab === 'year' && (
          <IonList style={{ background: 'transparent' }}>
            <IonItemGroup>
              <IonItemDivider style={{ '--background': '#333', color: '#aaa', '--padding-top': '10px', '--padding-bottom': '10px' }}>
                <IonLabel>September - August</IonLabel>
                <IonNote slot="end" color="primary" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  Total: {formatTime(yearData.reduce((acc, curr) => acc + curr.totalMinutes, 0))}
                </IonNote>
              </IonItemDivider>
              
              {yearData.map((data) => (
                <IonItem key={data.month} style={{ '--background': 'transparent', '--color': 'white' }}>
                  <IonLabel style={{ color: data.totalMinutes > 0 ? 'white' : '#666' }}>
                    {format(new Date(data.month + '-01T00:00:00'), 'MMMM yyyy')}
                  </IonLabel>
                  <IonNote slot="end" style={{ color: data.totalMinutes > 0 ? '#3880ff' : '#444', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatTime(data.totalMinutes)}
                  </IonNote>
                </IonItem>
              ))}
            </IonItemGroup>
          </IonList>
        )}
		
		        <IonAlert
          isOpen={showAlertMinutes}
          onDidDismiss={() => setShowAlertMinutes(false)}
          header={'Transfer Minutes'}
          message={`You have ${leftoverMinutes} minutes remaining. Would you like to transfer them to the next month?`}
          buttons={[
            { text: 'No', role: 'cancel' },
            { 
              text: 'Yes, Transfer', 
              handler: () => { transferMinutes(); } 
            }
          ]}
        />

        <GoalModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} onSave={handleSaveGoal} currentHours={goal.hours} monthDisplay={monthDisplay} />

      <ReportModal isOpen={showEditModal} onClose={() => {setShowEditModal(false);setSelectedReport(null); loadData(); }} editEntry={selectedReport} />

      </IonContent>
    </IonPage>
  );
};

export default Report;