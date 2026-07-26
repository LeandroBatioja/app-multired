'use client';

export default function StorageBar({ used, total }: { used: number; total: number }) {
  const percentage = (used / total) * 100;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <div className={`bg-white border rounded-lg p-4 ${
      isCritical ? 'border-red-300' : isWarning ? 'border-amber-300' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Espacio de almacenamiento</h3>
        <span className="text-sm text-gray-500">
          {used} GB / {total} GB
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {Math.round(percentage)}% utilizado · {Math.max(total - used, 0).toFixed(1)} GB disponibles
        </p>
        {isCritical && (
          <p className="text-xs text-red-600 font-medium">
            Almacenamiento casi lleno — elimina archivos
          </p>
        )}
        {!isCritical && isWarning && (
          <p className="text-xs text-amber-600 font-medium">
            Te quedan menos de {Math.round((total - used))} GB
          </p>
        )}
      </div>
    </div>
  );
}
