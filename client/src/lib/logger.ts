/**
 * logger.ts — Service de logging global pour 97import v2
 * Les erreurs sont loguées en localStorage IMMÉDIATEMENT puis dans Firestore
 * Le logger ne doit JAMAIS faire planter l'application
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type LogType =
  | "email_error"
  | "api_error"
  | "firestore_error"
  | "pdf_error"
  | "auth_error"
  | "unknown_error";

interface LogEntry {
  type: LogType | "info";
  message: string;
  context?: string;
  user_email?: string;
  stack_trace?: string;
}

const LOCAL_KEY = "97import_error_logs";

/** Sauvegarder en localStorage immédiatement (survit aux crashs) */
function saveLocal(entry: LogEntry & { timestamp: string }) {
  try {
    const logs = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    logs.push(entry);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(logs.slice(-50)));
  } catch {
    // localStorage plein ou indisponible — ignorer
  }
}

export const logError = async (entry: LogEntry): Promise<void> => {
  const timestamp = new Date().toISOString();

  // 1. Sauvegarder en localStorage IMMÉDIATEMENT (avant Firestore)
  saveLocal({ ...entry, timestamp });

  // 2. Console
  console.error(`[${(entry.type || "ERROR").toUpperCase()}]`, entry.message);

  // 3. Tenter Firestore (peut échouer sans crasher)
  try {
    await addDoc(collection(db, "error_logs"), {
      type: entry.type,
      message: entry.message,
      context: entry.context || "",
      user_email: entry.user_email || "",
      stack_trace: entry.stack_trace || "",
      resolved: false,
      created_at: serverTimestamp(),
    });
  } catch (e) {
    console.error("[LOGGER FIRESTORE FAILED]", e);
  }
};

export const logInfo = (context: string, message: string): void => {
  console.log(`[INFO][${context}]`, message);
  saveLocal({
    type: "info",
    message,
    context,
    timestamp: new Date().toISOString(),
  });
};

/** Lire les logs locaux (pour AdminLogs) */
export function getLocalLogs(): Array<LogEntry & { timestamp: string }> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Vider les logs locaux */
export function clearLocalLogs(): void {
  localStorage.removeItem(LOCAL_KEY);
}
