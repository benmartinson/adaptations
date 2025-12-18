# React Sandbox

A Docker-based sandbox for validating React component rendering with provided data.

## Purpose

This sandbox allows the backend to validate that React components render successfully with the transformed data output. It catches:

- Import/module errors
- React render errors (via SSR with `renderToString`)
- Runtime JavaScript errors
- Component errors (missing props, type errors, etc.)

## Building the Docker Image

```bash
cd react_sandbox
docker build -t react-sandbox .
```

## How It Works

1. The Ruby `ReactSandbox` service copies the bundled component (from `public/ai_bundles/`) to a temp directory
2. Docker runs the `render_test.js` script in an isolated container (no network access)
3. The script:
   - Sets up a minimal DOM environment with JSDOM
   - Assigns `window.React` for the react_shim used in bundles
   - Dynamically imports the bundled React component
   - Attempts to render it with `renderToString`
   - Catches any errors during import or render
4. Results are written to `/workspace/out/result.json`
5. The Ruby service reads the result and returns success/error status

## Usage from Ruby

```ruby
# Check if the sandbox is available
if ReactSandbox.available?
  # Pass the file_name from TaskUiFile (e.g., "/ai_bundles/task-preview-XYZ.js")
  result = ReactSandbox.validate_render(ui_file.file_name, data_hash)

  if result[:success]
    puts "Component renders successfully!"
  else
    puts "Render error: #{result[:error]}"
  end
end
```

## Integration with Tests

The `RunTransformTestsJob` automatically validates UI rendering after a successful transform if:

1. The task has an active `TaskUiFile` with a `file_name`
2. The `react-sandbox` Docker image is available

If UI validation fails, the test is marked as `error` with a "UI Render Error" message.

## Key Implementation Details

- Uses the **bundled** `.js` file from `public/ai_bundles/`, not the source JSX
- The bundled files use a `react_shim` that expects `window.React` to be available
- The sandbox sets up `window.React` before importing the bundle
- No database changes required - uses existing `TaskUiFile.file_name`

## Limitations

- Uses React SSR (`renderToString`), which doesn't catch all browser-only errors
- No actual DOM interactions (clicks, hover, etc.)
- Limited browser API simulation (basic `window`/`document` via JSDOM)
- CSS validation is not performed
