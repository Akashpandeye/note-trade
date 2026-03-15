"use client";

import { useCallback, useRef, useState } from "react";

interface CsvUploaderProps {
  onFileAccepted: (text: string) => void;
  accept?: string;
}

export function CsvUploader({ onFileAccepted, accept = ".csv" }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file.");
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 px-6 py-8 text-gray-600 transition hover:border-green-500 hover:bg-green-50 hover:text-green-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:border-green-500 dark:hover:bg-green-950/30 dark:hover:text-green-400"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />
        <span className="text-sm font-medium">Click to upload Zerodha CSV</span>
        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">.csv only</span>
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
