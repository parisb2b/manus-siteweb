/**
 * logger.ts — Service de logging global
 * Les erreurs sont loguées en localStorage IMMÉDIATEMENT puis dans Supabase
 * Le logger ne doit JAMAIS faire planter l'application
 */

import { supabase } from "./supabase";

export type LogType =
  | "email_error"
  | "api_error"
  | "supabase_error"
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
    // Garder max 50 entrées
    localStorage.setItem(LOCAL_KEY, JSON.stringify(logs.slice(-50)));
  } catch {
    // localStorage plein ou indisponible — ignorer
  }
}

export const logError = async (entry: LogEntry): Promise<void> => {
  const timestamp = new Date().toISOString();

  // 1. Sauvegarder en localStorage IMMÉDIATEMENT (avant Supabase)
  saveLocal({ ...entry, timestamp });

  // 2. Console
  console.error(`[${(entry.type || "ERROR").toUpperCase()}]`, entry.message);

  // 3. Tenter Supabase (peut échouer sans crasher)
  try {
    if (!supabase) return;
    await supabase.from("error_logs").insert({
      type: entry.type,
      message: entry.message,
      context: entry.context || "",
      user_email: entry.user_email || "",
      stack_trace: entry.stack_trace || "",
      resolved: false,
    });
  } catch (e) {
    console.error("[LOGGER SUPABASE FAILED]", e);
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
