import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { appEnv } from "../config/brand.js";

export const createOpenAiClient = () => {
  if (!appEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  return new OpenAI({ apiKey: appEnv.OPENAI_API_KEY });
};

export const reasoningEffortForModel = (model: string) => {
  if (model.startsWith("gpt-5.4")) {
    return "medium";
  }

  return "low";
};

export const parseStructuredResponse = async <Schema extends z.ZodTypeAny>({
  client,
  schema,
  schemaName,
  instructions,
  input,
  maxOutputTokens,
  reasoningEffort = reasoningEffortForModel(appEnv.OPENAI_MODEL),
  retries = 2,
  verbosity = "low"
}: {
  client: OpenAI;
  schema: Schema;
  schemaName: string;
  instructions: string;
  input: string;
  maxOutputTokens: number;
  reasoningEffort?: "low" | "medium" | "high";
  retries?: number;
  verbosity?: "low" | "medium" | "high";
}): Promise<z.infer<Schema>> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await client.responses.parse({
        model: appEnv.OPENAI_MODEL,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
        reasoning: {
          effort: reasoningEffort
        },
        text: {
          format: zodTextFormat(schema, schemaName),
          verbosity
        }
      });

      const parsed = response.output_parsed;
      if (!parsed) {
        throw new Error(`Model did not return parsed output for ${schemaName}.`);
      }

      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Structured response failed for ${schemaName}.`);
};
