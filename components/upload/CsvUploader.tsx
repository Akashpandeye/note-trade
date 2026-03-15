"use client";

import { useCallback, useState } from "react";

interface CsvUploaderProps {
  onFileAccepted: (text: string) => void;
  accept?: string;
}

export function CsvUploader({ onFileAccepted, accept = ".csv" }: CsvUploaderProps) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (text) onFileAccepted(text);
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file, "UTF-8");
    },
    [onFileAccepted]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const onDragLeave = useCallback(() => setDrag(false), []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
      e.target.value = "";
    },
    [readFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          drag
            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
        }`}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input
          id="csv-input"
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Drag and drop your Zerodha tradebook CSV here, or click to browse.
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
