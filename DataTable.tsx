/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { SheetRow } from "../data";
import { Search, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface DataTableProps {
  data: SheetRow[];
  selectedSedes: string[];
}

export default function DataTable({ data, selectedSedes }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyShowIssues, setOnlyShowIssues] = useState(false);
  const [deduplicate, setDeduplicate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Track if a row is a duplicate in the overall loaded dataset (by index)
  const rowsWithDuplicateStatus = useMemo(() => {
    const seenIds = new Set<string>();
    return data.map((row) => {
      const isDup = seenIds.has(row.submissionId);
      seenIds.add(row.submissionId);
      return {
        ...row,
        isDuplicateOccurrence: isDup
      };
    });
  }, [data]);

  // Apply filters including list of selected sedes
  const filteredRows = useMemo(() => {
    let result = rowsWithDuplicateStatus;

    // Filter by selected sedes list
    result = result.filter((row) => selectedSedes.includes(row.sede));

    // Filter by Search term (case insensitive)
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (row) =>
          row.nombre.toLowerCase().includes(term) ||
          row.submissionId.toLowerCase().includes(term) ||
          row.detalleProblemas.toLowerCase().includes(term) ||
          row.comentarios.toLowerCase().includes(term)
      );
    }

    // Filter by only showing internet issues
    if (onlyShowIssues) {
      result = result.filter((row) => row.problemasInternet === "Sí");
    }

    // Apply strict deduplication on ID if enabled
    if (deduplicate) {
      result = result.filter((row) => !row.isDuplicateOccurrence);
    }

    return result;
  }, [rowsWithDuplicateStatus, selectedSedes, searchTerm, onlyShowIssues, deduplicate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedSedes, searchTerm, onlyShowIssues, deduplicate]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

  // Excel Compatible CSV downloader function with UTF-8 BOM
  const handleExportExcel = () => {
    const headers = [
      "ID Envío",
      "Fecha",
      "Colaborador",
      "Sede",
      "Problemas con Internet",
      "Detalle de Problemas",
      "Horario del Problema",
      "Impacto en Productividad",
      "Comentarios"
    ];

    const csvRows = [headers.join(";")]; // Use semicolon for seamless automatic column mapping in Spanish Excel

    filteredRows.forEach((row) => {
      const values = [
        row.submissionId,
        row.fecha,
        row.nombre,
        row.sede,
        row.problemasInternet,
        row.detalleProblemas,
        row.horarioProblema,
        row.impactoProductividad,
        row.comentarios
      ].map((val) => {
        // Enclose with quote marks and escape existing quotes to prevent parsing errors
        const escaped = String(val || "").replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(";"));
    });

    // Write UTF-8 BOM marker so Microsoft Excel reads accents and non-ASCII characters without distortion
    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Registro_de_respuestas_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white py-5 mb-6" id="registro-respuestas-panel">
      {/* Header section with title and quick controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-neutral-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1d1d1b] flex items-center gap-2 tracking-wide">
            📋 Registro de las respuestas
          </h3>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Mostrando {filteredRows.length} de {data.length} encuestas en total
          </p>
        </div>

        {/* Search bar & export tools */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative flex-grow lg:flex-grow-0 min-w-[200px]">
            <Search className="absolute left-3 top-2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-t-0 border-r-0 border-l-0 border-b border-neutral-200 placeholder:text-neutral-400 text-[#1d1d1b] text-xs pl-9 pr-4 py-1.5 w-full focus:outline-none focus:border-[#1d1d1b] transition duration-150 rounded-none font-sans"
            />
          </div>

          {/* Filters switches */}
          <button
            onClick={() => setOnlyShowIssues(!onlyShowIssues)}
            className={`px-3 py-1.5 text-[10px] tracking-wider font-bold transition duration-150 rounded-none cursor-pointer ${
              onlyShowIssues
                ? "bg-neutral-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Fallas: {onlyShowIssues ? "Solo Sí" : "Todas"}
          </button>

          <button
            onClick={() => setDeduplicate(!deduplicate)}
            className={`px-3 py-1.5 text-[10px] tracking-wider font-bold transition duration-150 rounded-none cursor-pointer ${
              deduplicate
                ? "bg-neutral-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Deduplicar: {deduplicate ? "Activo" : "Inactivo"}
          </button>

          {/* Excel Exporter action */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] tracking-wider font-bold bg-[#8C8C8C] hover:bg-neutral-600 text-white transition duration-150 rounded-none cursor-pointer"
            title="Descargar en formato Excel (.csv compatible)"
            id="descargar-excel-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar en Excel</span>
          </button>
        </div>
      </div>

      {/* Table layouts */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto" id="respuestas-table">
          <thead>
            <tr className="border-b border-neutral-300 text-[10px] font-semibold text-neutral-500 tracking-wider">
              <th className="py-3 px-4">Id envío</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-4">Sede</th>
              <th className="py-3 px-4 text-center">Falla</th>
              <th className="py-3 px-4">Detalle de problemas</th>
              <th className="py-3 px-4">Horario</th>
              <th className="py-3 px-4 text-center">Impacto</th>
              <th className="py-3 px-4">Comentario</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-neutral-200 font-sans text-neutral-700">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-neutral-500 font-sans text-xs bg-white">
                  Ningún registro coincide con los filtros aplicados
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => (
                <tr
                  key={`${row.submissionId}-${idx}`}
                  className={`hover:bg-neutral-50/70 transition-colors bg-white ${
                    row.problemasInternet === "Sí" ? "bg-red-500/[0.01]" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[#1d1d1b] whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span>{row.submissionId}</span>
                      {row.isDuplicateOccurrence && (
                        <span className="bg-white border-b border-neutral-300 text-[8px] px-1 text-neutral-500 font-sans tracking-wide rounded-none scale-90">
                          Duplicado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-neutral-600 whitespace-nowrap">
                    {row.fecha}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1d1d1b] whitespace-nowrap">
                    {row.nombre}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-600 whitespace-nowrap">
                    <span className="bg-neutral-100 text-[#1d1d1b] font-bold px-1.5 py-0.5 rounded-none border-b border-neutral-200">
                      {row.sede}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {row.problemasInternet === "Sí" ? (
                      <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-none text-[9px] font-bold bg-neutral-200 text-[#1d1d1b]">
                        <AlertCircle className="w-3 h-3 text-red-700" />
                        <span>Sí</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-none text-[9px] font-bold border-b border-neutral-200 text-neutral-500">
                        <CheckCircle className="w-3 h-3 text-green-700 opacity-60" />
                        <span>No</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate" title={row.detalleProblemas}>
                    {row.detalleProblemas || "-"}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#1d1d1b] whitespace-nowrap">
                    {row.horarioProblema || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold ${
                        row.impactoProductividad.toString().match(/[4-5]/) || row.impactoProductividad.toLowerCase().includes("alto")
                          ? "bg-neutral-600 text-white"
                          : row.impactoProductividad.toString().match(/[2-3]/) || row.impactoProductividad.toLowerCase().includes("medio")
                          ? "bg-[#8C8C8C] text-white"
                          : "border border-neutral-300 text-neutral-600"
                      }`}
                    >
                      Impacto {row.impactoProductividad}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-500 max-w-xs truncate italic" title={row.comentarios}>
                    {row.comentarios || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination panel */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200 text-xs text-neutral-600 cursor-default font-sans bg-white p-3">
          <span className="text-neutral-500 font-sans">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 transition duration-150 rounded-none border ${
                currentPage === 1
                  ? "opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400"
                  : "border-[#C6C6C6] text-[#1d1d1b] hover:bg-[#C6C6C6] cursor-pointer bg-white"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 transition duration-150 rounded-none border ${
                currentPage === totalPages
                  ? "opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400"
                  : "border-[#C6C6C6] text-[#1d1d1b] hover:bg-[#C6C6C6] cursor-pointer bg-white"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
