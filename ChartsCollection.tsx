/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { SheetRow } from "../data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";
import { AlertCircle, Clock, BarChart3, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface ChartsCollectionProps {
  data: SheetRow[];
  selectedSedes: string[];
}

// Function to parse textual or numerical impact to a number 1 to 5
export function parseImpactToNumber(val: string): number {
  if (!val) return 1;
  const cleaned = val.trim();
  const digitMatch = cleaned.match(/[1-5]/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }
  const lower = cleaned.toLowerCase();
  if (lower.includes("muy alto") || lower.includes("grave") || lower.includes("mucho") || lower.includes("alto")) {
    return 5;
  }
  if (lower.includes("notable") || lower.includes("importante")) {
    return 4;
  }
  if (lower.includes("medio") || lower.includes("moderado") || lower.includes("promedio")) {
    return 3;
  }
  if (lower.includes("bajo") || lower.includes("leve") || lower.includes("pequeño")) {
    return 2;
  }
  return 1; // "Ninguno" or "Muy poco impactado"
}

export default function ChartsCollection({ data, selectedSedes }: ChartsCollectionProps) {
  // 1. Filter by selected Sedes
  const filteredData = useMemo(() => {
    return data.filter((row) => selectedSedes.includes(row.sede));
  }, [data, selectedSedes]);

  // 2. Deduplicate submissions by Submission ID for specific metrics if requested
  const uniqueSubmissions = useMemo(() => {
    const seen = new Set<string>();
    return filteredData.filter((row) => {
      const id = row.submissionId;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [filteredData]);

  // 3. Count "Problemas frecuentes" based on entire filtered incident set
  // Each cell can contain more than one problem separated by ","
  const problemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const incidentRows = filteredData.filter((row) => row.problemasInternet === "Sí");

    incidentRows.forEach((row) => {
      const details = row.detalleProblemas || "";
      if (details.trim() !== "" && details.toLowerCase() !== "ninguno" && details !== "-") {
        const parts = details.split(",");
        parts.forEach((p) => {
          const cleaned = p.trim();
          if (cleaned) {
            // Capitalize first letter elegantly
            const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
            counts[formatted] = (counts[formatted] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Total problems found for percentage calculation
  const totalProblemsFound = useMemo(() => {
    return problemCounts.reduce((acc, curr) => acc + curr.count, 0);
  }, [problemCounts]);

  // 4. Count "Horario de las fallas" from deduplicated unique submissions with internet problems
  const horarioCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    const uniqueIncidents = uniqueSubmissions.filter((row) => row.problemasInternet === "Sí");

    uniqueIncidents.forEach((row) => {
      const h = row.horarioProblema ? row.horarioProblema.trim() : "";
      if (h === "" || h === "No aplica" || h === "-") {
        counts["Sin especificar"] = (counts["Sin especificar"] || 0) + 1;
      } else {
        counts[h] = (counts[h] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        if (a.name === "Sin especificar") return 1;
        if (b.name === "Sin especificar") return -1;
        return b.value - a.value;
      });
  }, [uniqueSubmissions]);

  // 5. Count "Impacto en la productividad" (1 to 5)
  // Counts how many unique people with internet problems selected each rating from 1 to 5
  const impactCounts = useMemo(() => {
    const ratings: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const uniqueIncidents = uniqueSubmissions.filter((row) => row.problemasInternet === "Sí");

    uniqueIncidents.forEach((row) => {
      const impNum = parseImpactToNumber(row.impactoProductividad);
      if (impNum >= 1 && impNum <= 5) {
        ratings[impNum] += 1;
      } else {
        ratings[1] += 1; // Default
      }
    });

    return Object.entries(ratings).map(([rating, count]) => ({
      rating: parseInt(rating, 10),
      count,
      label: rating === "1" ? "1 - Muy poco" : rating === "5" ? "5 - Mucho" : rating
    }));
  }, [uniqueSubmissions]);

  const totalRespondentsForImpact = useMemo(() => {
    return impactCounts.reduce((acc, curr) => acc + curr.count, 0);
  }, [impactCounts]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#ffffff] border-b border-r border-neutral-300 p-3 rounded-none text-xs shadow-md">
          <p className="font-bold text-[#1d1d1b] mb-1 font-sans">{label}</p>
          <p className="text-neutral-600 flex justify-between space-x-6">
            <span className="font-sans">Incidentes:</span>
            <span className="font-bold text-[#1d1d1b]">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" id="dashboard-sections-container">
      
      {/* SECCIÓN 1: PROBLEMAS FRECUENTES */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        id="section-problemas-frecuentes"
        className="bg-white py-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-4 border-b border-neutral-100 pb-3">
            <AlertCircle className="w-5 h-5 text-neutral-400" />
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1b] tracking-wide">
                Problemas frecuentes
              </h3>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {problemCounts.length === 0 ? (
              <div className="text-xs text-neutral-400 text-center py-10 font-sans">
                Sin fallas registradas en los filtros seleccionados
              </div>
            ) : (
              problemCounts.map((item, idx) => {
                const percentage = totalProblemsFound > 0 
                  ? Math.round((item.count / totalProblemsFound) * 100) 
                  : 0;
                return (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between items-center text-xs mb-1 font-sans">
                      <span className="font-medium text-[#1d1d1b] truncate max-w-[190px]">
                        {item.name}
                      </span>
                      <span className="font-mono text-neutral-500 text-[10px]">
                        {item.count} fallas ({percentage}%)
                      </span>
                    </div>
                    {/* Simplified status bar */}
                    <div className="w-full bg-neutral-200 h-1.5 rounded-none overflow-hidden">
                      <div
                        className="bg-[#8C8C8C] h-1.5 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[10px] text-neutral-400 border-t border-neutral-200 mt-4 pt-3">
          Total de problemas contabilizados: {totalProblemsFound}
        </div>
      </motion.div>

      {/* SECCIÓN 2: HORARIO DE LAS FALLAS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        id="section-horario-fallas"
        className="bg-white py-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-4 border-b border-neutral-100 pb-3">
            <Clock className="w-5 h-5 text-neutral-400" />
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1b] tracking-wide">
                Horario de las fallas
              </h3>
            </div>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {horarioCounts.length === 0 ? (
              <div className="text-xs text-neutral-400 text-center font-sans">
                Sin datos de horario disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={horarioCounts}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis
                    dataKey="name"
                    stroke="#1d1d1b"
                    fontSize={9}
                    tickLine={false}
                    axisLine={{ stroke: "#C6C6C6", strokeWidth: 1 }}
                    className="font-sans font-medium"
                  />
                  <YAxis
                    stroke="#1d1d1b"
                    fontSize={9}
                    tickLine={false}
                    axisLine={{ stroke: "#C6C6C6", strokeWidth: 1 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Fallas" fill="#C6C6C6" radius={[1, 1, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-around gap-2 text-center text-[10px] border-t border-neutral-100 mt-4 pt-3 font-sans">
          {horarioCounts.slice(0, 4).map((item, idx) => (
            <div key={idx} className="px-2 text-center min-w-[70px] max-w-[120px]">
              <span className="block text-[#1d1d1b] font-bold text-sm leading-none mb-1">
                {item.value}
              </span>
              <span className="text-neutral-500 text-[9px] leading-tight block">{item.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SECCIÓN 3: IMPACTO EN LA PRODUCTIVIDAD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        id="section-impacto-productividad"
        className="bg-white py-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-4 border-b border-neutral-100 pb-3">
            <BarChart3 className="w-5 h-5 text-neutral-400" />
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1b] tracking-wide">
                Impacto en la productividad
              </h3>
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center mb-3">
            {totalRespondentsForImpact === 0 ? (
              <div className="text-xs text-neutral-400 text-center font-sans">
                Sin registros de impacto en los filtros seleccionados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactCounts}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis
                    dataKey="rating"
                    stroke="#1d1d1b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#C6C6C6", strokeWidth: 1 }}
                    className="font-sans font-bold"
                  />
                  <YAxis
                    stroke="#1d1d1b"
                    fontSize={9}
                    tickLine={false}
                    axisLine={{ stroke: "#C6C6C6", strokeWidth: 1 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const num = payload[0].payload.rating;
                        const scoreLabel =
                          num === 1
                            ? "1 - Muy poco impacto"
                            : num === 5
                            ? "5 - Mucho impacto"
                            : `Nivel ${num}`;
                        return (
                          <div className="bg-[#ffffff] border-b border-r border-neutral-300 p-2 rounded-none text-xs shadow">
                            <p className="font-bold text-[#1d1d1b]">{scoreLabel}</p>
                            <p className="text-neutral-500">Respuestas: <strong className="text-[#1d1d1b]">{payload[0].value}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#8C8C8C" radius={[1, 1, 0, 0]} maxBarSize={30}>
                    {impactCounts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.rating >= 4 ? "#525252" : entry.rating >= 2 ? "#8C8C8C" : "#C6C6C6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Legend showing 1-5 layout counts */}
        <div className="flex justify-between items-center text-[10px] bg-white py-2 border-b border-neutral-100 font-sans">
          <span className="text-neutral-400 font-bold shrink-0">1 (Muy poco)</span>
          <div className="flex space-x-1.5 overflow-x-auto px-2">
            {impactCounts.map((item) => (
              <span key={item.rating} className="font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5" title={`Nivel ${item.rating}`}>
                <strong>{item.rating}:</strong> {item.count}
              </span>
            ))}
          </div>
          <span className="text-[#1d1d1b] font-bold shrink-0">5 (Mucho)</span>
        </div>
      </motion.div>

    </div>
  );
}
