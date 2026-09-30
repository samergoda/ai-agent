# AI Agent

A minimal command-line AI agent that talks to a hosted LLM and can search the
web. It runs an agent loop: the model can request tools, the agent executes
them, feeds the results back, and continues until the model produces a final
answer.

## Features

- Interactive CLI chat loop
- Hosted LLM via an OpenAI-compatible API
- Web search tool powered by [Tavily](https://tavily.com)
- Conversation memory within a session

## Requirements

- Node.js 18+
- A hosted LLM API key (OpenAI-compatible endpoint)
- A Tavily API key for web search

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   CODECRAFT_API_KEY=your_hosted_llm_key
   TAVILY_API_KEY=your_tavily_key
   ```

   > The code reads `CODECRAFT_API_KEY` and `TAVILY_API_KEY`
   > (see `config/index.ts`). Make sure the names match exactly —
   > a typo such as `TAVILT_API_KEY` will leave the key `undefined`
   > and break web search at runtime.

## Running

```bash
npx tsx src/index.ts
```

Type your message at the `You:` prompt. Type `exit` to quit.

For convenience you can add scripts to `package.json`:

```json
"scripts": {
  "dev": "tsx src/index.ts",
  "start": "tsx src/index.ts"
}
```

Then run:

```bash
npm run dev
```

## Configuration

Model and clients are configured in `config/index.ts`:

```ts
const MODEL = "claude-opus-4.8";
```

Change `MODEL` to any model string your hosted endpoint accepts. The client
points at an OpenAI-compatible base URL:

```ts
const client = new OpenAI({
  apiKey: process.env.CODECRAFT_API_KEY!,
  baseURL: "https://codecraftapi.com/v1",
});
```

## Project structure

```
.
├── src/
│   └── index.ts      # Agent loop + CLI entry point
├── tools/
│   └── index.ts      # Tool definitions (schema) passed to the LLM
├── config/
│   └── index.ts      # Model name and API clients (OpenAI, Tavily)
├── types/
│   └── index.d.ts    # Shared message types
└── .env              # API keys (do not commit)
```

## How it works

1. The user message is added to the conversation history.
2. The agent calls the hosted LLM with the history and the available tools.
3. If the model requests a tool, the agent runs it (e.g. `search_web`),
   appends the result to the history, and loops.
4. When the model responds without requesting a tool, that answer is returned
   to the user.

## Tools

| Tool         | Description                                          |
| ------------ | ---------------------------------------------------- |
| `search_web` | Searches the internet via Tavily for current info.   |

## Security

- **Never commit `.env`.** Add a `.gitignore` containing `.env` and
  `node_modules/`.
- If API keys have ever been committed or shared, rotate them in the
  provider dashboards.
