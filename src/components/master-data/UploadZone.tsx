import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isParsing: boolean;
}

export function UploadZone({ onFileSelect, isParsing }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors',
        isDragOver ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50',
        isParsing && 'opacity-50 pointer-events-none'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xlsx, .xls"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleInputChange}
        disabled={isParsing}
      />
      <div className="flex bg-white p-4 rounded-full shadow-sm mb-4">
        <UploadCloud className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {isParsing ? 'Processing File...' : 'Click to upload or drag and drop'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        XLSX or XLS file (max 10MB)
      </p>
    </div>
  );
}
