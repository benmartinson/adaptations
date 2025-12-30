# Adaptations

A Rails 8 + React application for building **AI-powered data transformation pipelines** with automatic UI generation. Transform external API data into beautiful React components using intelligent code generation.

---

## ✨ What is This?

Adaptations is a development tool that helps you:

1. **Connect to APIs** — Point to any REST endpoint (built-in Open Library integration)
2. **Generate UI Components** — AI creates React components that visualize your data
3. **Build Transformations** — Generate Ruby code that converts API responses into UI-ready data
4. **Test & Iterate** — Run automated tests, refine transformations with AI feedback
5. **Deploy** — Bundle everything for production use

Perfect for rapidly prototyping data-driven interfaces without writing boilerplate transformation code.

---

## 🛠 Tech Stack

### Backend

| Tool                  | Purpose                              |
| --------------------- | ------------------------------------ |
| **Ruby on Rails 8.1** | Web framework & API                  |
| **SQLite**            | Database                             |
| **Solid Queue**       | Background job processing            |
| **Solid Cable**       | WebSocket connections (Action Cable) |
| **Google Gemini API** | AI code generation                   |
| **Docker**            | Sandboxed code execution             |

### Frontend

| Tool               | Purpose             |
| ------------------ | ------------------- |
| **React 18**       | UI components       |
| **React Router 7** | Client-side routing |
| **Tailwind CSS 4** | Styling             |
| **esbuild**        | JavaScript bundling |
| **PostCSS**        | CSS processing      |

---

## 🚀 Getting Started

### Prerequisites

- Ruby 3.x
- Node.js 18+
- Yarn 4.x
- SQLite 3
- Docker (for sandboxed code execution)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd adaptations

# Install Ruby dependencies
bundle install

# Install JavaScript dependencies
yarn install

# Setup database
bin/rails db:create db:migrate db:seed

# Set up your environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env
```

### Environment Variables

Create a `.env` file with:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

```bash
# Start all services (Rails server, JS watcher, CSS watcher, iframe builder)
bin/dev
```

This runs:

- **Rails server** on `http://localhost:3000`
- **esbuild** in watch mode for JavaScript
- **PostCSS** in watch mode for CSS
- **Iframe component builder** in watch mode

### Running Tests

```bash
# Ruby tests
bin/rails test

# JavaScript tests
yarn test:js

# Watch mode for JS tests
yarn test:js:watch
```

---

## 📁 Project Structure

```
app/
├── assets/builds/        # Compiled JS/CSS assets
├── channels/             # Action Cable channels
├── controllers/
│   └── api/              # JSON API endpoints
├── javascript/
│   ├── components/       # React components
│   │   ├── task/         # Task runner UI
│   │   ├── link/         # Link runner UI
│   │   └── common/       # Shared UI components
│   ├── hooks/            # React hooks
│   ├── ai_bundles/       # AI-generated component bundles
│   └── iframe_components/# Sandboxed preview components
├── jobs/                 # Background jobs
│   ├── transform_code_generation_job.rb
│   ├── preview_response_generation_job.rb
│   └── run_transform_tests_job.rb
├── models/
│   ├── task.rb           # Core task model (status, transform code, payloads)
│   ├── test.rb           # Test cases with input/expected output
│   ├── sub_task.rb       # Child tasks for chained workflows
│   ├── task_ui_file.rb   # Generated React component files
│   └── ...
├── services/
│   ├── gemini_chat.rb    # AI integration
│   ├── transform_process.rb
│   └── open_library_*.rb # Open Library API services
└── views/
```

---

## 🔄 How It Works

### 1. Create a Task

Navigate to `/tasks` and create a new transformation task. Specify:

- **API Endpoint** — The data source URL
- **System Tag** — A unique identifier for your UI component
- **Element Type** — Card layouts, lists, etc.

### 2. Generate UI Preview

The system fetches your API data and uses Gemini AI to generate a React component that visualizes the response structure.

### 3. Build Transformation Code

AI generates Ruby code (`transformation_procedure`) that converts the raw API response into the exact shape your React component expects.

```ruby
def transformation_procedure(data)
  # AI-generated transformation logic
  {
    title: data["name"],
    image: data["covers"]&.first,
    # ...
  }
end
```

### 4. Test & Iterate

- Create test cases with sample inputs and expected outputs
- Run tests in a sandboxed Docker environment
- AI automatically refines the transformation based on failed tests

### 5. Deploy

Export your transformation and UI components for production use. Still in progress

---

## 🔗 Key Features

### Task Types

| Type                  | Description                             |
| --------------------- | --------------------------------------- |
| `api_transform`       | Transform API data → UI component props |
| `subtask_connector`   | Chain tasks together                    |
| `list_link_connector` | Link list items to detail views         |

### Real-time Updates

WebSocket connections (`TaskChannel`) provide live updates during:

- AI code generation
- Test execution
- Preview rendering

### Sandboxed Execution

Transformation code runs in isolated Docker containers for security.

---

## 📚 API Routes

```
GET  /api/books/:isbn              # Book details
GET  /api/books/:work_id/editions  # Book editions
GET  /api/authors/:slug            # Author details
GET  /api/authors/:slug/books      # Author's books

# Task Management
GET    /api/tasks                  # List tasks
POST   /api/tasks                  # Create task
GET    /api/tasks/:id              # Task details
PATCH  /api/tasks/:id              # Update task
DELETE /api/tasks/:id              # Delete task
POST   /api/tasks/:id/run_job      # Run task job
POST   /api/tasks/:id/run_tests    # Run all tests
```

---

## 🧪 Development

### Build Commands

```bash
# Build JavaScript once
yarn build

# Build CSS once
yarn build:css

# Build iframe components
yarn build:iframe

# Watch modes
yarn build:watch
yarn build:css:watch
yarn build:iframe:watch
```

### Background Jobs

Jobs run via Solid Queue:

```bash
bin/jobs  # Start job worker
```

---
