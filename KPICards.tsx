/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SheetRow } from "../data";
import { Wifi, Users, AlertTriangle, Building, Clock, Check } from "lucide-react";
import { motion } from "motion/react";

interface KPICardsProps {
  data: SheetRow[];
}

export default function KPICards({ data }: KPICardsProps) {
  // Deduplicate by Submission ID for specific metrics
  const uniqueSubmissions = React.useMemo(() => {
    const seen = new Set<string>();
    return data.filter((row) => {
      const id = row.submissionId;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [data]);

  const stats = React.useMemo(() => {
    const totalLines = data.length;
    const totalUnique = uniqueSubmissions.length;
    
    // Complaints where internet problems is 'Sí' (Columna F)
    const uniqueComplaints = uniqueSubmissions.filter(r => r.problemasInternet === "Sí");
    
    // Percentage of active complaints out of unique submissions
    const failureRate = totalUnique > 0
      ? Math.round((uniqueComplaints.length / totalUnique) * 100)
      : 0;

    // High productivity impact count (using unique submissions as requested)
    const highImpact = uniqueSubmissions.filter(r => r.impactoProductividad.toLowerCase().includes("alto"));
    const highImpactRate = uniqueComplaints.length > 0
      ? Math.round((highImpact.length / uniqueComplaints.length) * 100)
      : 0;

    // Determine Sede with most complaints
    const sedeComplaints: Record<string, number> = {};
    uniqueComplaints.forEach(r => {
      sedeComplaints[r.sede] = (sedeComplaints[r.sede] || 0) + 1;
    });

    let topSede = "Ninguna";
    let maxComplaints = 0;
    Object.entries(sedeComplaints).forEach(([sede, count]) => {
      if (count > maxComplaints) {
        maxComplaints = count;
        topSede = sede;
      }
    });

    return {
      totalLines,
      totalUnique,
      failureRate,
      highImpactRate,
      highImpactCount: highImpact.length,
      topSede,
      activeComplaints: uniqueComplaints.length
    };
  }, [data, uniqueSubmissions]);

  // Framer Motion entry animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.25 } },
  };

  const cssCleanSedeName = (sede: string) => {
    return sede.replace(/^Sede\s+/i, "").trim();
  };

  const cardsInfo = [
    {
      title: "Respuestas recibidas",
      value: stats.totalUnique,
      subtext: `${stats.totalLines} respuestas totales`,
      icon: <Users className="w-5 h-5 text-neutral-400" />,
      id: "kpi-respuestas-recibidas"
    },
    {
      title: "Porcentaje de reportes de fallas",
      value: `${stats.failureRate}%`,
      subtext: "Del total de colaboradores registrados",
      icon: <Check className="w-5 h-5 text-neutral-400" />,
      id: "kpi-porcentaje-fallas"
    },
    {
      title: "Reporte de fallas",
      value: stats.activeComplaints,
      subtext: "Colaboradores que reportaron fallas",
      icon: <AlertTriangle className="w-5 h-5 text-neutral-400" />,
      id: "kpi-reporte-fallas"
    },
    {
      title: "Sede con más fallas",
      value: cssCleanSedeName(stats.topSede),
      subtext: "Sede con mayor número de reportes",
      icon: <Building className="w-5 h-5 text-neutral-400" />,
      id: "kpi-sede-mas-fallas"
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      id="kpi-cards-grid"
    >
      {cardsInfo.map((card, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          id={card.id}
          className="bg-white p-4 flex flex-col justify-between h-28 border-0"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#1d1d1b] opacity-80">
              {card.title}
            </span>
            {card.icon}
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold text-[#1d1d1b] tracking-tight">
              {card.value}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500">
            {card.subtext}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
