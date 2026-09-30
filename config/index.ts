import { tavily } from "@tavily/core";
import OpenAI from "openai";

const MODEL = "claude-opus-4.8";

const client = new OpenAI({
  apiKey: process.env.CODECRAFT_API_KEY!,
  baseURL: "https://codecraftapi.com/v1",
});

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

export { MODEL, client, tavilyClient };
