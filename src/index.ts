import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import tools from "../tools";
import { client, MODEL, tavilyClient } from "../config";


// ============================================================
// CONVERSATION MEMORY
// ============================================================

const messages: Message[] = [
  {
    role: "system",
    content: `
You are a helpful AI agent.

You have access to tools that you can use when necessary.

When the user asks for current information, recent information,
news, websites, or information you do not know, use the search_web tool.

Do not invent search results.

After receiving a tool result, analyze it and provide a useful answer
to the user.

If no tool is required, answer normally.
    `.trim(),
  },
];

// ============================================================
// WEB SEARCH
// ============================================================

async function searchWeb(query: string) {
  console.log(`\n🔎 Searching the web: ${query}`);

  const response = await tavilyClient.search(query, {
    searchDepth: "basic",
    maxResults: 3,
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
  }));
}

// ============================================================
// TOOL EXECUTION
// ============================================================

async function executeTool(
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    case "search_web": {
      const query = args.query;

      if (typeof query !== "string") {
        throw new Error(
          "search_web requires a string 'query'"
        );
      }

      return await searchWeb(query);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================================
// CALL HOSTED LLM
// ============================================================

async function callLLM() {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: messages as any,
    tools: tools as any,
    tool_choice: "auto",
    temperature: 0.2,
  });

  const assistantMessage = response.choices[0]?.message;

  if (!assistantMessage) {
    throw new Error("Hosted LLM returned an empty response");
  }

  return assistantMessage;
}

// ============================================================
// AGENT
// ============================================================

async function runAgent(userMessage: string) {
  // Add user's message to conversation
  messages.push({
    role: "user",
    content: userMessage,
  });

  while (true) {
    console.log("🤔 Thinking...");

    const assistantMessage = await callLLM();

    // Save assistant message
    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? null,
      tool_calls: assistantMessage.tool_calls?.map((toolCall) => ({
        id: toolCall.id,
        type: "function",
        function: {
          name: toolCall.id,
          arguments: toolCall.type,
        },
      })),
    });

    // ========================================================
    // NO TOOL CALL
    // ========================================================

    if (!assistantMessage.tool_calls?.length) {
      console.log("No tools call");    
      return assistantMessage.content ?? "";
    }

    // ========================================================
    // TOOL CALLS
    // ========================================================

  for (const toolCall of assistantMessage.tool_calls) {
  if (toolCall.type !== "function") {
    continue;
  }

  const toolName = toolCall.function.name;
  const rawArguments = toolCall.function.arguments;

  let args: Record<string, unknown>;

  try {
    args = JSON.parse(rawArguments);
  } catch {
    console.error(
      "❌ Invalid tool arguments:",
      rawArguments
    );

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        error: "Invalid JSON arguments",
      }),
    });

    continue;
  }

  console.log(`\n🔧 Tool: ${toolName}`);
  console.log("   Arguments:", args);

  try {
    const result = await executeTool(toolName, args);

    console.log("   ✓ Tool completed");

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    });
  } catch (error) {
    console.error("   ✗ Tool failed");

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
    });
  }
}
  }
}

// ============================================================
// CLI
// ============================================================
async function main() {
  console.log("======================================");
  console.log("🤖 Hosted LLM Agent");
  console.log("======================================");
  console.log(`Model: ${MODEL}`);
  console.log("Type 'exit' to quit.\n");

  const rl = readline.createInterface({
    input,
    output,
  });

  try {
    while (true) {
      const userMessage = await rl.question("You: ");

      if (userMessage.trim().toLowerCase() === "exit") {
        console.log("\nGoodbye! 👋");
        break;
      }

      if (!userMessage.trim()) {
        continue;
      }

      try {
        const answer = await runAgent(userMessage);

        console.log(`\nAgent: ${answer}\n`);
      } catch (error) {
        console.error(
          "\n❌ Agent error:",
          error instanceof Error
            ? error.message
            : error
        );
      }
    }
  } finally {
    rl.close();
  }
}

// ============================================================
// START
// ============================================================

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});