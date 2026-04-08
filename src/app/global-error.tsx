"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          maxWidth: "800px",
          margin: "2rem auto",
        }}
      >
        <h1 style={{ color: "#c0392b" }}>Server Error</h1>
        <p style={{ color: "#666" }}>
          <strong>Message:</strong> {error.message}
        </p>
        {error.digest && (
          <p style={{ color: "#666" }}>
            <strong>Digest:</strong> {error.digest}
          </p>
        )}
        {error.stack && (
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Stack trace
            </summary>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "1rem",
                overflow: "auto",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#c8720c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
