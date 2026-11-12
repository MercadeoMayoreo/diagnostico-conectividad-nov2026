/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { HelpCircle, Info } from "lucide-react";

interface SheetsHelpPanelProps {
  onClose?: () => void;
}

export default function SheetsHelpPanel({ onClose }: SheetsHelpPanelProps) {
  const columnsRequired = [
    { name: "Id de envío (Submission Id)", desc: "Identificador único de envío para filtrar duplicados cronológicos.", key: true },
    { name: "Fecha", desc: "Fecha de la respuesta (ej. DD/MM/AAAA o Timestamp de Formularios).", key: false },
    { name: "Nombre y Apellido", desc: "Nombre completo del colaborador que reporta.", key: false },
    { name: "Sede", desc: "Lugar físico (ej: Sede Central, Sede Norte, Sede Sur, etc.).", key: false },
    { name: "Problemas con internet", desc: "Indica si hubo falla o no (ej: 'Sí' o 'No').", key: false },
    { name: "Detalle de Problemas", desc: "Razón detallada de la interrupción.", key: false },
    { name: "Horario del problema", desc: "Tramo horario (ej: Mañana, Tarde, Noche) - Tomado una vez por Submission Id.", key: true },
    { name: "Impacto en Productividad", desc: "Gravedad de la repercusión (ej: Alto, Medio, Bajo) - Tomado una vez por Submission Id.", key: true },
    { name: "Comentarios", desc: "Notas adicionales opcionales.", key: false }
  ];

  return (
    <div className="bg-white py-6 h-full text-xs text-neutral-700" id="sheets-help-panel">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-neutral-500" />
          <h3 className="text-sm font-semibold text-[#1d1d1b]">
            Instrucciones de conexión
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] tracking-wider px-2 py-1 border-b border-neutral-300 text-neutral-600 hover:text-[#1d1d1b] transition duration-150 rounded-none bg-white font-bold"
          >
            Cerrar
          </button>
        )}
      </div>

      <p className="text-neutral-600 leading-relaxed mb-4">
        Este dashboard dinámico se alimenta en tiempo real de cualquier hoja de cálculo de Google Sheets compatible. Puedes conectar tus propios datos de Formularios de Google siguiendo estos pasos:
      </p>

      {/* Steps list */}
      <ol className="space-y-3 mb-6 font-sans">
        <li className="flex items-start space-x-2.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-none border-b border-neutral-300 text-[#1d1d1b] font-bold text-[10px] shrink-0 mt-0.5 bg-white">
            1
          </span>
          <span className="text-neutral-600">
            <strong>Prepara tu Google Sheet:</strong> Asegúrate de que la primera fila contenga exactamente los siguientes encabezados (en cualquier orden, sin distinguir acentos o mayúsculas):
          </span>
        </li>

        {/* Columns Grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7 my-3">
          {columnsRequired.map((col, index) => (
            <div
              key={index}
              className={`p-2 border-b flex flex-col justify-between ${
                col.key ? "border-neutral-300 bg-white" : "border-neutral-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#1d1d1b]">{col.name}</span>
                {col.key && (
                  <span className="text-[8px] bg-neutral-100 text-[#1d1d1b] px-1 font-bold">
                    Id único
                  </span>
                )}
              </div>
              <span className="text-[9px] text-neutral-500 mt-1">{col.desc}</span>
            </div>
          ))}
        </div>

        <li className="flex items-start space-x-2.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-none border-b border-neutral-300 text-[#1d1d1b] font-bold text-[10px] shrink-0 mt-0.5 bg-white">
            2
          </span>
          <span className="text-neutral-600">
            <strong>Iniciar sesión con Google:</strong> Haz clic en el botón <strong className="text-[#1d1d1b]">Conectar Google Sheets</strong> en la parte superior de la página para otorgar permisos de lectura de la API de Hojas de cálculo de Google.
          </span>
        </li>

        <li className="flex items-start space-x-2.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-none border-b border-neutral-300 text-[#1d1d1b] font-bold text-[10px] shrink-0 mt-0.5 bg-white">
            3
          </span>
          <span className="text-neutral-600">
            <strong>Pegar el enlace o ID de la hoja:</strong> Copia la URL de tu hoja de cálculo e ingrésala en el campo de enlace de la barra superior, luego haz clic en <strong className="text-[#1d1d1b]">Cargar datos</strong>.
          </span>
        </li>
      </ol>

      <div className="p-3 border-b border-neutral-200 flex items-start space-x-3 bg-white">
        <Info className="w-5 h-5 text-neutral-400 shrink-0" />
        <div className="text-[11px] text-neutral-600 font-sans leading-relaxed">
          <strong className="text-[#1d1d1b]">Nota sobre el filtrado bidimensional de ID:</strong> según las especificaciones, los cálculos de <span className="underline decoration-[#C6C6C6]">Horario del problema</span> e <span className="underline decoration-[#C6C6C6]">Impacto en productividad</span> filtran las filas repetidas basándose en el <span className="font-mono">Submission Id</span>, garantizando que cada contingencia reportada se pondere individualmente y no distorsione las métricas horarias ni estadísticas generales por doble conteo de respuestas.
        </div>
      </div>
    </div>
  );
}
