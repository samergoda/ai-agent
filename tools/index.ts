 const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_web",
      description:
        "Search the internet for current or up-to-date information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
];



   export const messages: any[] = [
      {
        role: "system",
        content: `
You are a helpful AI coding assistant.

You have access to tools.

Available tools:
- search_web: Search the internet for current information.

Use search_web when:
- The user asks for current information.
- The user asks about recent events.
- The user asks about something that may have changed.
- You need information from the internet.

Do not use search_web for simple questions that you can answer without internet access.

When you use search_web:
1. Read the search results.
2. Use the results to answer the user.
3. Do not claim information that is not supported by the search results.
4. Include useful URLs from the search results when appropriate.

Keep your final answers concise.
`,
      },
    ];

export default tools;