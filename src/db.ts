import Dexie, { Table } from 'dexie';
import { format } from 'date-fns';

// 1. Definimos la estructura (Interfaces) de nuestros datos

export interface ReportEntry {
  id?: number;          // Autoincremental
  date: string;         // Formato 'YYYY-MM-DD' para facilitar búsquedas por mes
  minutes: number;      // Guardamos el tiempo en minutos (es más fácil sumar que "HH:MM")
  studies: number;
  kilometers: number;
  comment: string;
}

export interface MonthlyGoal {
  monthYear: string;    // Formato 'YYYY-MM' (Será nuestra llave primaria)
  profile: string;      // Ej: 'Special pioneer', 'Publisher'
  goalHours: number;    // Ej: 90, 50, 15
}

export interface ScheduleEntry {
  date: string;       // 'YYYY-MM-DD' (Llave primaria, solo 1 agenda por día)
  minutes: number;    // Tiempo agendado en minutos
  notes: string;      // Notas del día
}

// 2. Creamos la clase de la Base de Datos
export class MinistryDatabase extends Dexie {
  // Declaramos las tablas
  reports!: Table<ReportEntry, number>;
  goals!: Table<MonthlyGoal, string>;
  schedules!: Table<ScheduleEntry, string>;

  constructor() {
    super('MinistryAssistantDB');
    
    // 3. Definimos las tablas y sus índices (lo que usaremos para buscar)
	this.version(2).stores({
      reports: '++id, date',
      goals: 'monthYear',
      schedules: 'date' // 'date' será la llave primaria
    });
  }
}

// 4. Exportamos una instancia única para usarla en toda la app
export const db = new MinistryDatabase();

// --- Añadir al final de src/db.ts ---

/**
 * Guarda o actualiza un registro de predicación
 */
export const saveReport = async (report: Omit<ReportEntry, 'id'>) => {
  try {
    await db.reports.add(report);
    console.log('Reporte guardado exitosamente');
  } catch (error) {
    console.error('Error al guardar el reporte:', error);
  }
};

/**
 * Obtiene todos los reportes de un mes específico (Ej: '2026-06')
 */
export const getReportsByMonth = async (monthYear: string) => {
  // Buscamos todas las fechas que empiecen con "YYYY-MM"
  return await db.reports
    .where('date')
    .startsWith(monthYear)
    .toArray();
};

/**
 * Obtiene el total de horas y minutos de un mes
 */
export const getMonthlyTotalTime = async (monthYear: string) => {
  const reports = await getReportsByMonth(monthYear);
  const totalMinutes = reports.reduce((acc, curr) => acc + curr.minutes, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
};

/**
 * Obtiene la meta de un mes específico
 */
export const getGoal = async (monthYear: string) => {
  return await db.goals.get(monthYear);
};

/**
 * Guarda o actualiza la meta y perfil de un mes
 */
export const saveGoal = async (goal: MonthlyGoal) => {
  await db.goals.put(goal);
};

export const saveSchedule = async (schedule: ScheduleEntry) => {
  await db.schedules.put(schedule);
};

export const getSchedulesByMonth = async (monthYear: string) => {
  return await db.schedules
    .where('date')
    .startsWith(monthYear)
    .toArray();
};

/**
 * EXPORTAR: Crea un objeto con todos los datos y lo descarga como JSON
 */
export const exportBackup = async () => {
  const allReports = await db.reports.toArray();
  const allGoals = await db.goals.toArray();
  const allSchedules = await db.schedules.toArray();

  const backupData = {
    version: 1,
    date: new Date().toISOString(),
    reports: allReports,
    goals: allGoals,
    schedules: allSchedules
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ministry-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * IMPORTAR: Lee un archivo JSON y lo guarda en la base de datos
 */
export const importBackup = async (file: File) => {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Usamos una transacción para asegurar que no se corrompan los datos
        await db.transaction('rw', db.reports, db.goals, db.schedules, async () => {
          // Limpiar datos actuales (opcional, podrías elegir fusionarlos)
          await db.reports.clear();
          await db.goals.clear();
          await db.schedules.clear();

          // Insertar datos del backup
          await db.reports.bulkAdd(data.reports);
          await db.goals.bulkAdd(data.goals);
          await db.schedules.bulkAdd(data.schedules);
        });
        
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};

export const updateReport = async (report: ReportEntry) => {
  await db.reports.put(report); // .put actualiza si el ID existe, si no, crea.
};