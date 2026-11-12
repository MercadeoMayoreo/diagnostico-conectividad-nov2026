/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
import { SheetRow } from "./data";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Sheets Read-Only scope
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try to get token or require another explicit login to populate token
        // In typical Firebase configuration, we might need a popup or a quiet refresh,
        // but since we only cache the token in memory, we ask the user to sign in
        // to retrieve the token, or they can trigger googleSignIn manually.
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

// Sign in with Google PopUp
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Sheets API access token from authentication.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Authentication Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Extract Google Sheet ID from URL
export const extractSpreadsheetId = (urlOrId: string): string => {
  const trimmed = urlOrId.trim();
  if (!trimmed.includes("/") && trimmed.length > 15) {
    return trimmed; // It's probably already the spreadsheet ID
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

// Helper to normalize strings for mapping headers
const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "");    // Keep alphanumeric
};

// Clean and map rows from sheet array
export const parseSheetData = (values: any[][]): SheetRow[] => {
  if (!values || values.length === 0) return [];
  
  const headers = values[0].map(h => normalizeHeader(String(h || "")));
  
  // Find column indices based on loose text matches
  const colIndex = {
    submissionId: headers.findIndex(h => h.includes("submission") || h.includes("id") || h.includes("envio")),
    fecha: headers.findIndex(h => h.includes("fecha") || h.includes("date") || h.includes("tiempo") || h.includes("marca")),
    nombre: headers.findIndex(h => h.includes("nombre") || h.includes("apellido") || h.includes("user") || h.includes("usuario") || h.includes("completo")),
    sede: headers.findIndex(h => h.includes("sede") || h.includes("oficina") || h.includes("sucursal") || h.includes("lugar") || h.includes("filial") || h.includes("ciudad")),
    problemasInternet: headers.findIndex(h => h.includes("problema") || h.includes("falla") || h.includes("internet") || h.includes("lentitud")),
    detalleProblemas: headers.findIndex(h => h.includes("detalle") || h.includes("descripcion") || h.includes("fallas") || h.includes("que")),
    horarioProblema: headers.findIndex(h => h.includes("horario") || h.includes("hora") || h.includes("momento") || h.includes("cuando") || h.includes("rango")),
    impactoProductividad: headers.findIndex(h => h.includes("impacto") || h.includes("productividad") || h.includes("severidad") || h.includes("gravedad")),
    comentarios: headers.findIndex(h => h.includes("comentario") || h.includes("opinion") || h.includes("nota") || h.includes("observacion"))
  };

  const parsed: SheetRow[] = [];

  // Parse remaining rows
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r || r.length === 0) continue;

    // Read values based on indexes. If index not found (-1), fallback to sequential columns, or empty string.
    const getVal = (idx: number, fallbackCol: number): string => {
      if (idx !== -1 && idx < r.length) return String(r[idx] || "").trim();
      if (fallbackCol < r.length) return String(r[fallbackCol] || "").trim();
      return "";
    };

    const submissionId = getVal(colIndex.submissionId, 0) || `ROW-${i}`;
    const fecha = getVal(colIndex.fecha, 1) || "-";
    const nombre = getVal(colIndex.nombre, 2) || "Anónimo";
    const sede = getVal(colIndex.sede, 3) || "General";
    
    // Normalize "Sí" / "No"
    let problemasInternet = getVal(colIndex.problemasInternet, 4);
    if (!problemasInternet) problemasInternet = "No";
    if (["si", "s", "yes", "y", "true", "1", "sí"].includes(problemasInternet.toLowerCase())) {
      problemasInternet = "Sí";
    } else if (["no", "n", "false", "0"].includes(problemasInternet.toLowerCase())) {
      problemasInternet = "No";
    }

    const detalleProblemas = getVal(colIndex.detalleProblemas, 5) || "Ninguno";
    const horarioProblema = getVal(colIndex.horarioProblema, 6) || "No especificado";
    const impactoProductividad = getVal(colIndex.impactoProductividad, 7) || "Ninguno";
    const comentarios = getVal(colIndex.comentarios, 8) || "-";

    parsed.push({
      submissionId,
      fecha,
      nombre,
      sede,
      problemasInternet,
      detalleProblemas,
      horarioProblema,
      impactoProductividad,
      comentarios
    });
  }

  return parsed;
};

// Fetch values from Google Sheet
export const fetchGoogleSheetData = async (
  spreadsheetId: string,
  range: string = "Respuestas de formulario 1!A:I", // Fallback standard Google Form range
  token: string
): Promise<SheetRow[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // If ranges mismatch, let's try reading the first sheet of the document dynamically
      if (res.status === 400 || res.status === 404) {
        // Try getting info first to get sheet names
        const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
        const metaRes = await fetch(metadataUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const firstSheetTitle = metaData.sheets?.[0]?.properties?.title;
          if (firstSheetTitle && firstSheetTitle !== "Respuestas de formulario 1") {
            // Re-fetch using first sheet name
            const retryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetTitle + "!A:I")}`;
            const retryRes = await fetch(retryUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (retryRes.ok) {
              const data = await retryRes.json();
              return parseSheetData(data.values);
            }
          }
        }
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Fallo al obtener datos de Google Sheets (Status ${res.status})`);
    }

    const data = await res.json();
    return parseSheetData(data.values);
  } catch (error) {
    console.error("Sheet read error:", error);
    throw error;
  }
};

// Robust RFC-compliant CSV Parser to parse public Google Sheets export
export const parseCSV = (csvText: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuote = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // skip next double quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal);
      result.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (row.length > 0 || currentVal !== "") {
    row.push(currentVal);
    result.push(row);
  }
  return result;
};

// Fetch public Google Sheet data as CSV (CORS-enabled endpoint)
export const fetchPublicGoogleSheet = async (
  spreadsheetId: string,
  range: string = ""
): Promise<SheetRow[]> => {
  const sheetName = range ? range.split("!")[0].trim() : "";
  
  // Construct list of potential working URLs for fetching Google Sheets in public CSV format
  const urls: string[] = [];
  if (sheetName) {
    urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`);
  }
  urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`);
  urls.push(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`);
  
  let lastError: any = null;
  
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        continue;
      }
      const csvText = await res.text();
      
      // Verification: if GSheets returns an HTML login/sharing page instead of CSV text
      if (!csvText || csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("<html")) {
        continue;
      }
      
      const rows = parseCSV(csvText);
      const parsed = parseSheetData(rows);
      
      if (parsed && parsed.length > 0) {
        console.log(`Successfully fetched and parsed data from URL: ${url}`);
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed reading public spreadsheet from URL: ${url}`, error);
      lastError = error;
    }
  }
  
  throw lastError || new Error("La planilla no parece ser pública o el nombre de pestaña es incorrecto. Asegúrese de que 'Cualquier persona con el enlace puede ver' esté activado.");
};
