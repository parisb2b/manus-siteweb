/**
 * storage.ts — Service de stockage fichiers Firebase Storage pour 97import v2
 * Remplace l'ancien storage Supabase — API compatible
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload un fichier dans Firebase Storage.
 * Retourne l'URL publique en succès, null en échec.
 */
export async function uploadFile(
  file: File,
  folder: string = ""
): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() || "png";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const path = folder
      ? `${folder}/${safeName}_${Date.now()}.${ext}`
      : `${safeName}_${Date.now()}.${ext}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}

/**
 * Upload un Blob PDF dans Firebase Storage.
 * Retourne l'URL publique en succès, null en échec.
 */
export async function uploadPdfBlob(
  blob: Blob,
  folder: string,
  filename: string
): Promise<string | null> {
  try {
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const path = `${folder}/${safeName}_${Date.now()}.pdf`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: "application/pdf" });
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}

/**
 * Supprimer un fichier de Firebase Storage par son chemin.
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    await deleteObject(ref(storage, path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Lister les fichiers d'un dossier Firebase Storage.
 */
export async function listFiles(folder: string = "") {
  try {
    const listRef = ref(storage, folder);
    const result = await listAll(listRef);
    return result.items.map((item) => ({ name: item.name, fullPath: item.fullPath }));
  } catch {
    return [];
  }
}
