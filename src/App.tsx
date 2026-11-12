/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { SAMPLE_DATA, SheetRow } from "./data";
import {
  fetchPublicGoogleSheet,
  extractSpreadsheetId
} from "./googleService";
import KPICards from "./components/KPICards";
import ChartsCollection from "./components/ChartsCollection";
import DataTable from "./components/DataTable";
import {
  ChevronDown,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ============================================================================
// CONFIGURACIÓN DE GOOGLE SHEETS FIJA
// Reemplace estos valores con su enlace o ID de planilla y el nombre de la pestaña
// para que el tablero quede conectado permanentemente sin necesidad de parámetros.
// Asegúrese de que la planilla esté compartida con: "Cualquier persona con el enlace puede ver"
// ============================================================================
export const GOOGLE_SHEETS_CONFIG = {
  // EJEMPLO: Resplazar el vacío "" por su enlace de Sheets. Ej: "https://docs.google.com/spreadsheets/d/1DRGPOx6b5oT3bhF-G4-IinBbeLvBBoIDJVmtyQT7QAo/edit?usp=sharing"
  SPREADSHEET_LINK_OR_ID: "https://docs.google.com/spreadsheets/d/1PaptTkm-IxNzE4luzkBuUvFcfvFtPRTW7Mrzi9ZZdwQ/edit?usp=sharing", 

  // Escriba el nombre exacto de la pestaña donde están las respuestas de su formulario
  // Ej: "Respuestas de formulario 1". Si se deja vacío "", se lee la primera pestaña predeterminada.
  SHEET_TAB_NAME: "Hoja 1"
};

export default function App() {
  // Sheet configuration & data
  const [sheetData, setSheetData] = useState<SheetRow[]>(SAMPLE_DATA);
  const [isUsingDemoData, setIsUsingDemoData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSedes, setSelectedSedes] = useState<string[]>(["Beval", "Febeca"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dropdown reference to handle click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine active spreadsheet ID (Precedence: 1. Fixed Config, 2. URL Param, 3. LocalStorage)
  const [spreadsheetId] = useState<string | null>(() => {
    if (GOOGLE_SHEETS_CONFIG.SPREADSHEET_LINK_OR_ID.trim() !== "") {
      return extractSpreadsheetId(GOOGLE_SHEETS_CONFIG.SPREADSHEET_LINK_OR_ID);
    }
    const params = new URLSearchParams(window.location.search);
    const sheetParam = params.get("sheet") || params.get("id");
    if (sheetParam) {
      const extracted = extractSpreadsheetId(sheetParam);
      localStorage.setItem("connectivity_sheet_id", extracted);
      return extracted;
    }
    return localStorage.getItem("connectivity_sheet_id");
  });

  // Auto-fetch spreadsheet data on mount
  useEffect(() => {
    if (spreadsheetId) {
      setLoading(true);
      setErrorMsg(null);
      // Pass specified tab range configuration
      const tabRange = GOOGLE_SHEETS_CONFIG.SHEET_TAB_NAME || "";
      fetchPublicGoogleSheet(spreadsheetId, tabRange)
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setSheetData(fetched);
            setIsUsingDemoData(false);
          } else {
            setErrorMsg("No se encontraron registros válidos en la hoja de cálculo pública.");
            setSheetData(SAMPLE_DATA);
            setIsUsingDemoData(true);
          }
        })
        .catch((err) => {
          console.error("Error loading public sheet:", err);
          setErrorMsg(
            "No se pudieron cargar los datos de la hoja de cálculo. Asegúrese de que está compartida como pública ('Cualquier persona con el enlace puede ver')."
          );
          setSheetData(SAMPLE_DATA);
          setIsUsingDemoData(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Default to high-fidelity demo sample data
      setSheetData(SAMPLE_DATA);
      setIsUsingDemoData(true);
    }
  }, [spreadsheetId]);

  // Sync selectedSedes dynamically once data is loaded or changed
  useEffect(() => {
    const list = new Set<string>();
    sheetData.forEach((row) => {
      if (row.sede && row.sede.trim() !== "") {
        list.add(row.sede.trim());
      }
    });
    if (list.size > 0) {
      setSelectedSedes(Array.from(list));
    }
  }, [sheetData]);

  // Dynamically compute list of Sede locations for dropdown filters
  const sedeOptions = useMemo(() => {
    const list = new Set<string>();
    sheetData.forEach((row) => {
      if (row.sede && row.sede.trim() !== "") {
        list.add(row.sede.trim());
      }
    });
    return Array.from(list).sort();
  }, [sheetData]);

  // Filter dataset exclusively matching checked options
  const filteredData = useMemo(() => {
    return sheetData.filter((row) => selectedSedes.includes(row.sede));
  }, [sheetData, selectedSedes]);

  const isAllSelected = selectedSedes.length === sedeOptions.length;

  const handleToggleSede = (sedeName: string) => {
    if (selectedSedes.includes(sedeName)) {
      if (selectedSedes.length > 1) {
        setSelectedSedes(selectedSedes.filter((s) => s !== sedeName));
      }
    } else {
      setSelectedSedes([...selectedSedes, sedeName]);
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      if (sedeOptions.length > 0) {
        setSelectedSedes([sedeOptions[0]]); // Keep at least one selected to avoid empty view state
      }
    } else {
      setSelectedSedes([...sedeOptions]);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1b] p-4 md:p-8" id="app-root-container">
      {/* Upper Navigation Block */}
      <header className="py-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-0" id="header-branding">
        <div>
          <h1 className="text-2.5xl font-bold tracking-tight text-[#1d1d1b] sm:text-3xl" id="main-dashboard-title">
            Diagnóstico de conectividad
          </h1>
          {loading ? (
            <p className="text-xs text-neutral-400 font-sans tracking-wide mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
              Obteniendo datos de su planilla de Google...
            </p>
          ) : isUsingDemoData ? (
            <p className="text-xs text-neutral-400 font-sans tracking-wide mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              Visualizando datos de demostración local
            </p>
          ) : (
            <p className="text-xs text-[#1d1d1b] font-semibold font-sans tracking-wide mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-800 inline-block animate-pulse"></span>
              Sincronizado en tiempo real con Google Sheets
            </p>
          )}
        </div>

        {/* Compact Sede Filter Selector on top-right */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef} id="sede-dropdown-filter-container">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full sm:w-auto space-x-3 px-4 py-2 border-b border-neutral-300 text-xs font-bold text-[#1d1d1b] hover:border-neutral-800 transition bg-white select-none cursor-pointer"
            id="sede-dropdown-trigger"
          >
            <span>Sede: {isAllSelected ? "Todas" : selectedSedes.join(", ")}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 z-50 bg-white border border-neutral-200 p-3 min-w-[200px] shadow-md flex flex-col gap-1.5 rounded-none" id="sede-dropdown-options">
              {/* Checkbox for "Todas" / "All" */}
              <label className="flex items-center space-x-2.5 px-2 py-1.5 hover:bg-neutral-50 cursor-pointer select-none text-xs font-bold text-[#1d1d1b]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="w-4 h-4 accent-neutral-600 cursor-pointer"
                />
                <span>Todas</span>
              </label>

              <div className="border-t border-neutral-100 my-1"></div>

              {/* Individual Sede Checkboxes */}
              {sedeOptions.map((sede) => {
                const isChecked = selectedSedes.includes(sede);
                return (
                  <label key={sede} className="flex items-center space-x-2.5 px-2 py-1.5 hover:bg-neutral-50 cursor-pointer select-none text-xs font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSede(sede)}
                      className="w-4 h-4 accent-neutral-600 cursor-pointer"
                    />
                    <span>{sede}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Dynamic Feedback Alerts */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 p-4 rounded-none mb-6 text-xs flex items-center justify-between font-sans"
            id="error-feedback-alert"
          >
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-[10px] font-bold px-2 hover:underline select-none">
              Aceptar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Showcase - fed directly with current filtered data */}
      <KPICards data={filteredData} />

      {/* Primary Analytics Charts Section */}
      <ChartsCollection data={sheetData} selectedSedes={selectedSedes} />

      {/* Complete Data Logger and Table View */}
      <DataTable data={sheetData} selectedSedes={selectedSedes} />

      {/* Minimalistic Footer & Guide on Sheet Integration */}
      <footer className="text-center font-sans text-[10px] text-neutral-400 py-6 mt-12 border-t border-neutral-100 flex flex-col items-center gap-1 select-none" id="dashboard-footer">
        <div>
          © 2026 Diagnóstico de conectividad · Monitoreo de incidencias de red Beval & Febeca
        </div>
        <div className="text-[9px] text-neutral-400 mt-1 max-w-xl leading-relaxed">
          Para cargar otra hoja de cálculo compartida en vivo, simplemente añade <code className="font-mono bg-neutral-50 px-1 py-0.5 border border-neutral-200 text-[#1d1d1b]">?sheet=TULINK</code> en la barra de direcciones del navegador.
        </div>
      </footer>
    </div>
  );
}
