/**
 * logger.ts — Service de logging global
 * Les erreurs sont loguées dans la table error_logs de Supabase
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
  type: LogType;
  message: string;
  context?: string;
  user_email?: string;
  stack_trace?: string;
}

export const logError = async (entry: LogEntry): Promise<void> => {
  try {
    console.error(`[${entry.type.toUpperCase()}]`, entry.message);
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
    // Logger ne doit JAMAIS planter l'app
    console.error("[LOGGER FAILED]", e);
  }
};

export const logInfo = (context: string, message: string): void => {
  console.log(`[INFO][${context}]`, message);
};
