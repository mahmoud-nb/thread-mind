# ThreadMind

**AI-powered thread-based development assistant with context optimization.**

ThreadMind is an open-source local web interface that organizes your AI-assisted development into hierarchical threads. Each thread maintains its own context, making conversations focused and efficient.

It runs on your machine — your data stays local, your API keys stay private.

---

## Features

### Thread-based Conversations
Organize discussions hierarchically. Create sub-threads for sub-tasks, reference sibling threads for shared context. Keep conversations focused and navigable.

### Smart Context Engine
Automatic context optimization with summaries, pinned messages, and cross-thread references. Save tokens without losing context. The engine assembles the optimal prompt for each message by prioritizing:
- **Pinned messages** — always included in child threads
- **Thread summaries** — auto-generated, compact conversation history
- **Recent messages** — the latest exchanges
- **Referenced threads** — cross-thread context injection

### Multi-Provider Support
Switch between AI providers per message. Use the best model for each task:

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude Sonnet 4, Haiku 4.5, Opus 4 |
| **OpenAI** | GPT-4o, GPT-4o Mini |
| **Google** | Gemini 2.5 Flash, 2.5 Pro |
| **DeepSeek** | DeepSeek Chat, Reasoner |
| **Mistral** | Large, Small, Codestral |
| **Meta** | Llama 3.3 70B, Llama 4 Scout (via Together AI) |

### Plan & Agent Modes
- **Plan mode** — Conversation only. Brainstorm, plan, review code. No file system access.
- **Agent mode** — The AI can read, write, and edit files in your project directory. Write operations require explicit approval.

### Team Collaboration
Share threads with your team via git:
1. Export threads to `.threadmind/` markdown files
2. Commit and push via git
3. Teammates import — your threads appear as read-only context

The SQLite database stays local. Only markdown files are shared.

### Token Tracking
Real-time token usage monitoring with cost estimation and savings tracking from context optimization.

---

## Quick Start

```bash
npx thread-mind
```

This starts the ThreadMind server on `http://localhost:3000`. No account required.

### Setup

1. **Configure a provider** — Go to Settings (gear icon), enter an API key, test, and save
2. **Create a project** — Link a target directory on your machine
3. **Start a thread** — Click "+" to create a thread and begin chatting

---

## Architecture

ThreadMind is built with:

- **[Nuxt 4](https://nuxt.com)** — Vue 3 fullstack framework
- **[Prisma](https://www.prisma.io) + SQLite** — Local database, zero setup
- **[TailwindCSS](https://tailwindcss.com)** — Design system with dark/light themes
- **SSE (Server-Sent Events)** — Real-time streaming responses
- **OpenAI-compatible API pattern** — DeepSeek, Mistral, Meta use the same SDK with different base URLs

### Project Structure

```
thread-mind/
├── app/                    # Frontend (Nuxt 4)
│   ├── components/         # Vue components (chat, docs, thread, ui)
│   ├── composables/        # State management (useChat, useThread, etc.)
│   ├── layouts/            # App layout with top bar
│   ├── pages/              # Routes (/, /projects, /settings)
│   └── stores/             # Pinia stores
├── server/                 # Backend (Nitro)
│   ├── api/                # REST + SSE endpoints
│   └── utils/ai/           # AI providers, tools, context engine
├── prisma/                 # Database schema
├── i18n/                   # Translations (EN, FR)
└── bin/                    # CLI entry point
```

---

## Data & Privacy

- **100% local** — The SQLite database lives on your machine
- **No proxy** — API calls go directly from your machine to the provider
- **No telemetry** — No usage data is collected or sent anywhere
- **Git-friendly** — Add `prisma/*.db` to `.gitignore` (already done). Only `.threadmind/` markdown files are meant to be shared

---

## Configuration

### Environment Variables

ThreadMind stores all configuration in the local SQLite database. No `.env` file needed. API keys are entered via the Settings UI.

### CLI Options

```bash
npx thread-mind              # Start on default port (3000)
npx thread-mind --port 4000  # Custom port
```

---

## Internationalization

ThreadMind ships with English and French. The language can be switched in the top bar.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
git clone https://github.com/your-username/thread-mind.git
cd thread-mind
npm install
npx prisma db push
npm run dev
```

---

## License

[MIT](LICENSE)
