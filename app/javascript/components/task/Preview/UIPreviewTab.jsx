import React, { useState, useEffect } from "react";
import PreviewList from "./PreviewList";
import useTaskProgress from "../../../hooks/useTaskProgress";

function DynamicUIFile({ file, responseJson }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const [iframeError, setIframeError] = useState(null);
  responseJson["links"] = "test";
  console.log("responseJson", responseJson);

  useEffect(() => {
    let cancelled = false;

    async function loadComponent() {
      try {
        setError(null);
        const mod = await import(file.file_name);
        if (!mod?.default)
          throw new Error("Remote module had no default export");

        if (!cancelled) setComponent(() => mod.default);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setError(e?.message || `Failed to load ${file.file_name}`);
      }
    }

    loadComponent();
    return () => {
      cancelled = true;
    };
  }, [file.file_name]);

  // Listen for height updates and errors from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "iframe-resize" && event.data.height) {
        setIframeHeight(event.data.height);
        setIframeError(null); // Clear any previous errors when content loads successfully
      } else if (event.data.type === "iframe-error" && event.data.error) {
        setIframeError(event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!Component || !responseJson) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading UI component...</p>
      </div>
    );
  }

  // Load the same compiled CSS the parent page is using (this includes full Tailwind).
  // This is more reliable than Tailwind's CDN helper inside sandboxed iframes.
  const baseHref =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const appStylesheetHref =
    typeof document !== "undefined"
      ? document.querySelector('link[rel="stylesheet"][href*="application"]')
          ?.href
      : null;
  const cssHref = appStylesheetHref || "/assets/application.css";

  // Create iframe content that loads the component dynamically in isolation
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <base href="${baseHref}/">
        <link id="app-css" rel="stylesheet" href="${cssHref}">
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: white;
          }

          /* Error and loading states */
          .error {
            color: #dc2626;
            padding: 16px;
            border: 1px solid #ef4444;
            border-radius: 8px;
            background: #fef2f2;
            font-size: 14px;
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
          }
        </style>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      </head>
      <body>
        <div id="root">
          <div class="loading">Loading component...</div>
        </div>
        <script>
          const componentUrl = '${file.file_name}';
          const componentData = ${JSON.stringify(responseJson)};

          function postErrorToParent(message) {
            try {
              window.parent.postMessage({ type: 'iframe-error', error: message }, '*');
            } catch (_) {
              // ignore
            }
          }

          // Catch "page break" style failures (runtime errors + unhandled promise rejections)
          window.addEventListener('error', (event) => {
            const msg = event && event.message ? event.message : 'Unknown runtime error';
            postErrorToParent('Runtime Error: ' + msg);
          });
          window.addEventListener('unhandledrejection', (event) => {
            const reason = event && event.reason ? event.reason : null;
            const msg =
              typeof reason === 'string'
                ? reason
                : (reason && reason.message) ? reason.message : 'Unhandled promise rejection';
            postErrorToParent('Unhandled Rejection: ' + msg);
          });

          // Wait for CSS to load before rendering
          function waitForCSS() {
            return new Promise((resolve) => {
              const link = document.getElementById('app-css');
              if (!link) return resolve();
              if (link.sheet) return resolve();
              link.addEventListener('load', () => resolve(), { once: true });
              link.addEventListener('error', () => resolve(), { once: true });
            });
          }

          async function loadAndRenderComponent() {
            try {
              // Wait for CSS to be available
              await waitForCSS();

              // Load the component module
              const module = await import(componentUrl);

              if (!module.default) {
                throw new Error('Component module has no default export');
              }

              const Component = module.default;

              class ErrorBoundary extends React.Component {
                constructor(props) {
                  super(props);
                  this.state = { error: null };
                }
                static getDerivedStateFromError(error) {
                  return { error };
                }
                componentDidCatch(error) {
                  const msg = (error && error.message) ? error.message : 'Render error';
                  postErrorToParent('Render Error: ' + msg);
                }
                render() {
                  if (this.state.error) {
                    const msg = (this.state.error && this.state.error.message)
                      ? this.state.error.message
                      : 'Unknown render error';
                    return React.createElement(
                      'div',
                      { className: 'error' },
                      React.createElement('strong', null, 'Component Error:'),
                      React.createElement('br', null),
                      msg
                    );
                  }
                  return this.props.children;
                }
              }

              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(
                React.createElement(
                  ErrorBoundary,
                  null,
                  React.createElement(Component, { data: componentData })
                )
              );

              // Send height to parent after rendering
              const sendHeight = () => {
                const height = document.body.scrollHeight;
                window.parent.postMessage({ type: 'iframe-resize', height }, '*');
              };

              setTimeout(sendHeight, 100);

              // Watch for content changes and update height
              const resizeObserver = new ResizeObserver(sendHeight);
              resizeObserver.observe(document.body);

            } catch (error) {
              console.error('Component loading/rendering error:', error);
              const errorMessage = error.message || 'Unknown error occurred while loading component';
              document.getElementById('root').innerHTML =
                '<div class="error"><strong>Component Error:</strong><br/>' + errorMessage + '</div>';

              // Send error to parent
              postErrorToParent('Component Error: ' + errorMessage);
            }
          }

          loadAndRenderComponent();
        </script>
      </body>
    </html>
  `;

  // Handle iframe load events
  const handleIframeLoad = () => {};

  const handleIframeError = () => {
    setIframeError("Failed to load iframe content");
  };

  if (iframeError) {
    return (
      <div
        style={{
          width: "100%",
          height: "200px",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#dc2626",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Iframe Error
          </div>
          <div>{iframeError}</div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={iframeContent}
      style={{
        width: "100%",
        height: `${iframeHeight}px`,
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
      }}
      title="UI Preview"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );
}

export default function UIPreviewTab({
  isGeneratingPreview,
  onNextStep,
  taskId,
}) {
  const { responseJson } = useTaskProgress(taskId);
  const [uiFiles, setUiFiles] = useState([]);
  const [uiFilesError, setUiFilesError] = useState(null);
  const [cyclingMessage, setCyclingMessage] = useState(
    "Generating UI Preview..."
  );

  // Handle cycling message during transform code generation
  useEffect(() => {
    let interval;
    if (isGeneratingPreview) {
      interval = setInterval(() => {
        setCyclingMessage((prev) =>
          prev === "Generating UI Preview..."
            ? "Background process, may take several seconds"
            : "Generating UI Preview..."
        );
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGeneratingPreview]);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    async function loadUiFiles() {
      try {
        setUiFilesError(null);
        const res = await fetch(`/api/tasks/${taskId}/ui_files`);
        if (!res.ok) throw new Error(`UI files endpoint failed: ${res.status}`);
        const data = await res.json();

        if (!cancelled) setUiFiles(data);
      } catch (e) {
        if (!cancelled)
          setUiFilesError(e?.message || "Failed to load UI files");
      }
    }

    loadUiFiles();
    return () => {
      cancelled = true;
    };
  }, [taskId, responseJson]);

  return (
    <div className="space-y-4">
      {responseJson && (
        <>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              {isGeneratingPreview && (
                <span className="text-black text-sm font-bold">
                  {cyclingMessage}
                </span>
              )}
              <button
                type="button"
                onClick={onNextStep}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next Step
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
            {uiFiles.length > 0 ? (
              uiFiles.map((uiFile) => (
                <DynamicUIFile
                  key={uiFile.id}
                  file={uiFile}
                  responseJson={responseJson}
                />
              ))
            ) : (
              <PreviewList
                toResponseText={JSON.stringify(responseJson, null, 2)}
              />
            )}
          </div>

          {uiFilesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{uiFilesError}</p>
            </div>
          )}
        </>
      )}

      {!responseJson && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No preview available yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
