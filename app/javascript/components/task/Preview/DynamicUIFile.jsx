import React, { useEffect, useMemo, useRef, useState } from "react";
import useTaskProgress from "../../../hooks/useTaskProgress";

export default function DynamicUIFile({ taskId, responseJson }) {
  const { snapshot } = useTaskProgress(taskId);
  const iframeRef = useRef(null);

  const [activeFile, setActiveFile] = useState(null);
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(400);
  const [iframeError, setIframeError] = useState(null);

  const frameId = useMemo(
    () => `${activeFile?.id || "ui"}-${Math.random().toString(36).slice(2)}`,
    [activeFile?.id]
  );

  // Fetch active UI file when taskId or snapshot.phase changes
  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    async function fetchActiveFile() {
      try {
        const res = await fetch(`/api/tasks/${taskId}/ui_files`);
        if (!res.ok) throw new Error(`UI files endpoint failed: ${res.status}`);
        const files = await res.json();

        if (!cancelled && files.length > 0) {
          setActiveFile(files[0]); // API returns active files in order, first one is most recent
        }
      } catch (e) {
        console.error("Failed to fetch active UI file:", e);
        if (!cancelled) {
          setActiveFile(null);
        }
      }
    }

    fetchActiveFile();
    return () => {
      cancelled = true;
    };
  }, [taskId, snapshot?.metadata?.phase]);

  useEffect(() => {
    if (!activeFile) return;

    let cancelled = false;

    async function loadComponent() {
      try {
        setError(null);
        const mod = await import(activeFile.file_name);
        if (!mod?.default) {
          throw new Error("Remote module had no default export");
        }

        if (!cancelled) setComponent(() => mod.default);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message || `Failed to load ${activeFile.file_name}`);
        }
      }
    }

    loadComponent();
    return () => {
      cancelled = true;
    };
  }, [activeFile?.file_name]);

  // Listen for height updates and errors from *this* iframe only.
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from our iframe window.
      if (event.source !== iframeRef.current?.contentWindow) return;
      // Only accept same-origin messages (we expect allow-same-origin).
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || data.frameId !== frameId) return;

      if (data.type === "iframe-resize" && data.height) {
        setIframeHeight(data.height);
        setIframeError(null);
      } else if (data.type === "iframe-error" && data.error) {
        setIframeError(data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frameId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!activeFile || !Component || !responseJson) {
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
          const frameId = '${frameId}';
          const componentUrl = '${activeFile?.file_name || ""}';
          const componentData = ${JSON.stringify(responseJson)};

          function postToParent(payload) {
            try {
              window.parent.postMessage({ frameId, ...payload }, window.location.origin);
            } catch (_) {
              // ignore
            }
          }

          function postErrorToParent(message) {
            postToParent({ type: 'iframe-error', error: message });
          }

          // Catch "page break" failures (runtime errors + unhandled promise rejections)
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
              await waitForCSS();

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

              const sendHeight = () => {
                const height = document.body.scrollHeight;
                postToParent({ type: 'iframe-resize', height });
              };

              setTimeout(sendHeight, 100);

              if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(sendHeight);
                resizeObserver.observe(document.body);
              }
            } catch (error) {
              console.error('Component loading/rendering error:', error);
              const errorMessage = error.message || 'Unknown error occurred while loading component';
              document.getElementById('root').innerHTML =
                '<div class="error"><strong>Component Error:</strong><br/>' + errorMessage + '</div>';
              postErrorToParent('Component Error: ' + errorMessage);
            }
          }

          loadAndRenderComponent();
        </script>
      </body>
    </html>
  `;

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
      ref={iframeRef}
      srcDoc={iframeContent}
      style={{
        width: "100%",
        height: `100vh`,
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
      }}
      title="UI Preview"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      onError={handleIframeError}
    />
  );
}
