import { RefreshCw, AlertCircle, Inbox } from "lucide-react";

// ── Column definition ──────────────────────────────────────
export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalCount?: number;
}

// ── Skeleton rows ──────────────────────────────────────────
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  error,
  onRetry,
  onRowClick,
  emptyMessage = "Aucune donnée",
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  totalCount,
}: AdminTableProps<T>) {
  const total = totalCount ?? data.length;
  const totalPages = Math.ceil(total / pageSize);

  // Si pas de pagination externe, paginer localement
  const paginatedData = onPageChange
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-700 text-sm font-medium">Erreur de chargement</p>
          <p className="text-red-600 text-xs mt-0.5">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 font-medium border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <SkeletonRows cols={columns.length} />
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={(row as any).id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                      {col.render
                        ? col.render(row, idx)
                        : (row as any)[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            {total} résultat{total > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === page
                      ? "bg-[#1E3A5F] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 7 && (
              <span className="text-xs text-gray-400 px-1">…{totalPages}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
