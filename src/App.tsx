import React, { useState, useCallback, ChangeEvent, DragEvent } from "react";

const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    backgroundColor: "#f8fafc",
    padding: "2rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: "1.5rem",
    borderRadius: "0.5rem",
    marginBottom: "2rem",
    textAlign: "center" as const,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
  title: {
    margin: 0,
    fontSize: "1.875rem",
    fontWeight: "600",
  },
  dropzone: {
    border: "3px dashed #94a3b8",
    borderRadius: "0.75rem",
    padding: "2rem",
    textAlign: "center" as const,
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
    marginBottom: "1.5rem",
    cursor: "pointer",
  },
  activeDropzone: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  textarea: {
    width: "100%",
    minHeight: "150px",
    padding: "1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontFamily: "monospace",
    resize: "vertical" as const,
    marginBottom: "1rem",
    backgroundColor: "#ffffff",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginBottom: "1.5rem",
  },
  fileList: {
    backgroundColor: "#ffffff",
    padding: "1rem",
    borderRadius: "0.5rem",
    marginBottom: "1.5rem",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem",
    backgroundColor: "#f1f5f9",
    borderRadius: "0.375rem",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem",
    borderRadius: "0.375rem",
    marginBottom: "0.5rem",
  },
  validResult: {
    borderLeft: "4px solid #22c55e",
  },
  invalidResult: {
    borderLeft: "4px solid #ef4444",
  },
  summary: {
    textAlign: "right" as const,
    padding: "1rem",
    backgroundColor: "#1e293b",
    color: "white",
    borderRadius: "0.5rem",
    marginTop: "1rem",
  },
};

interface ValidationResult {
  line: string;
  isValid: boolean;
}

interface PasswordRule {
  char: string;
  min: number;
  max: number;
}

interface FileUploadState {
  isDragging: boolean;
  files: File[];
}

const PasswordValidator: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [fileState, setFileState] = useState<FileUploadState>({
    isDragging: false,
    files: [],
  });
  const [loading, setLoading] = useState<boolean>(false);

  const parseRule = useCallback((rule: string): PasswordRule => {
    const [char, range] = rule.split(" ");
    const [min, max] = range.split("-").map(Number);
    return { char, min, max };
  }, []);

  const validatePassword = useCallback(
    (line: string): boolean => {
      try {
        const [rule, password] = line.split(": ");
        if (!rule || !password) throw new Error("Invalid format");

        const { char, min, max } = parseRule(rule);
        const charCount = (password.match(new RegExp(char, "g")) || []).length;
        return charCount >= min && charCount <= max;
      } catch (error) {
        console.error(`Validation error: ${error}`);
        return false;
      }
    },
    [parseRule]
  );

  const processFileContent = useCallback(
    (content: string) => {
      const lines = content.trim().split("\n").filter(Boolean);
      return lines.map((line) => ({
        line,
        isValid: validatePassword(line),
      }));
    },
    [validatePassword]
  );

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setFileState((prev) => ({ ...prev, isDragging: false }));
      setLoading(true);

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "text/plain"
      );

      if (files.length) {
        const allResults: ValidationResult[] = [];

        for (const file of files) {
          const text = await file.text();
          const results = processFileContent(text);
          allResults.push(...results);
        }

        setResults(allResults);
        setFileState((prev) => ({ ...prev, files }));
      }
      setLoading(false);
    },
    [processFileContent]
  );

  const handleFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (file) => file.type === "text/plain"
      );
      setLoading(true);

      if (files.length) {
        const allResults: ValidationResult[] = [];

        for (const file of files) {
          const text = await file.text();
          const results = processFileContent(text);
          allResults.push(...results);
        }

        setResults(allResults);
        setFileState((prev) => ({ ...prev, files }));
      }
      setLoading(false);
    },
    [processFileContent]
  );

  const handleValidate = useCallback(() => {
    const results = processFileContent(input);
    setResults(results);
  }, [input, processFileContent]);

  const validCount = results.filter((r) => r.isValid).length;

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.dropzone,
          ...(fileState.isDragging ? styles.activeDropzone : {}),
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setFileState((prev) => ({ ...prev, isDragging: true }));
        }}
        onDragLeave={() =>
          setFileState((prev) => ({ ...prev, isDragging: false }))
        }
        onDrop={handleDrop}
      >
        {loading ? "Processing files..." : "Drop files or click to upload"}
      </div>

      <textarea
        style={styles.textarea}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste passwords here"
      />

      <button style={styles.button} onClick={handleValidate} disabled={loading}>
        {loading ? "Validating..." : "Validate Passwords"}
      </button>

      {results.map(({ line, isValid }, index) => (
        <div
          key={index}
          style={{
            ...styles.resultItem,
            ...(isValid ? styles.validResult : styles.invalidResult),
          }}
        >
          {isValid ? "✅" : "❌"} {line}
        </div>
      ))}
    </div>
  );
};

export default PasswordValidator;
