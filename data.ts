/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SheetRow {
  submissionId: string;
  fecha: string;
  nombre: string;
  sede: string; // 'Beval' o 'Febeca' o 'Otras'
  problemasInternet: string; // 'Sí' o 'No'
  detalleProblemas: string; // Ej: 'Caída de Internet, Lentitud, VPN desconectada'
  horarioProblema: string; // 'Mañana', 'Tarde', 'Noche', etc.
  impactoProductividad: string; // Del '1' al '5' o textos como 'Alto' / 'Medio' / 'Bajo'
  comentarios: string;
}

export const SAMPLE_DATA: SheetRow[] = [
  {
    submissionId: "SUB-101",
    fecha: "2026-06-15",
    nombre: "Juan Pérez",
    sede: "Beval",
    problemasInternet: "Sí",
    detalleProblemas: "Lentitud extrema, Cortes de Zoom, VPN desconectada",
    horarioProblema: "Mañana",
    impactoProductividad: "5",
    comentarios: "Se cae la conexión constantemente a la mitad de las llamadas de ventas."
  },
  {
    submissionId: "SUB-101", // Duplicado para pruebas de deducción
    fecha: "2026-06-15",
    nombre: "Juan Pérez",
    sede: "Beval",
    problemasInternet: "Sí",
    detalleProblemas: "Lentitud extrema, VPN desconectada",
    horarioProblema: "Mañana",
    impactoProductividad: "5",
    comentarios: "Segundo reporte del día porque la VPN sigue fallando."
  },
  {
    submissionId: "SUB-102",
    fecha: "2026-06-15",
    nombre: "María Gómez",
    sede: "Febeca",
    problemasInternet: "Sí",
    detalleProblemas: "Navegación lenta en ERP, Lentitud extrema",
    horarioProblema: "Tarde",
    impactoProductividad: "3",
    comentarios: "Los CRM tardan hasta un minuto en cargar."
  },
  {
    submissionId: "SUB-103",
    fecha: "2026-06-15",
    nombre: "Carlos Ruiz",
    sede: "Beval",
    problemasInternet: "No",
    detalleProblemas: "Ninguno",
    horarioProblema: "No aplica",
    impactoProductividad: "1",
    comentarios: "La conexión ha estado muy estable durante todo el día."
  },
  {
    submissionId: "SUB-104",
    fecha: "2026-06-15",
    nombre: "Ana López",
    sede: "Beval",
    problemasInternet: "Sí",
    detalleProblemas: "Desconexión total, Caída del servidor local",
    horarioProblema: "Mañana",
    impactoProductividad: "5",
    comentarios: "Estuvimos sin internet toda la oficina durante 45 minutos."
  },
  {
    submissionId: "SUB-105",
    fecha: "2026-06-16",
    nombre: "Pedro Ortiz",
    sede: "Febeca",
    problemasInternet: "Sí",
    detalleProblemas: "Microcortes frecuentes, Caída de Zoom",
    horarioProblema: "Tarde",
    impactoProductividad: "4",
    comentarios: "No se cae del todo pero interrumpe los flujos de trabajo continuamente."
  },
  {
    submissionId: "SUB-106",
    fecha: "2026-06-16",
    nombre: "Laura Álvarez",
    sede: "Febeca",
    problemasInternet: "Sí",
    detalleProblemas: "Lentitud extrema, VPN desconectada",
    horarioProblema: "Noche",
    impactoProductividad: "5",
    comentarios: "En el turno noche el ancho de banda baja críticamente."
  },
  {
    submissionId: "SUB-107",
    fecha: "2026-06-16",
    nombre: "Roberto Díaz",
    sede: "Beval",
    problemasInternet: "No",
    detalleProblemas: "Ninguno",
    horarioProblema: "No aplica",
    impactoProductividad: "1",
    comentarios: "Perfecto hoy, sin demoras."
  },
  {
    submissionId: "SUB-108",
    fecha: "2026-06-16",
    nombre: "Sofía Martínez",
    sede: "Febeca",
    problemasInternet: "Sí",
    detalleProblemas: "Largo tiempo de carga de archivos",
    horarioProblema: "Mañana",
    impactoProductividad: "2",
    comentarios: "Subir reportes de Excel a Drive está tomando demasiado tiempo hoy."
  },
  {
    submissionId: "SUB-109",
    fecha: "2026-06-16",
    nombre: "Diego Torres",
    sede: "Beval",
    problemasInternet: "Sí",
    detalleProblemas: "Desconexión completa de Wifi, Lentitud extrema",
    horarioProblema: "Tarde",
    impactoProductividad: "4",
    comentarios: "Tuvimos que usar datos móviles personales para responder correos urgentes."
  },
  {
    submissionId: "SUB-110",
    fecha: "2026-06-16",
    nombre: "Sonia Giraldo",
    sede: "Febeca",
    problemasInternet: "Sí",
    detalleProblemas: "VPN desconectada, Caída de Zoom",
    horarioProblema: "Noche",
    impactoProductividad: "5",
    comentarios: "Turno noche completamente paralizado porque no se puede conectar a la base de datos."
  }
];
