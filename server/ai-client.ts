import {
  unstable_v2_createSession,
  unstable_v2_resumeSession,
} from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function getToken(): string {
  const raw =
    process.platform === "darwin"
      ? execSync('security find-generic-password -s "Claude Code-credentials" -a "$(whoami)" -w').toString()
      : readFileSync(join(homedir(), ".credentials.json"), "utf-8");
  return JSON.parse(raw).claudeAiOauth.accessToken;
}

process.env.ANTHROPIC_API_KEY ??= getToken();

const SYSTEM_PROMPT = `You are a helpful AI assistant. You can help users with a wide variety of tasks including:
- Answering questions
- Writing and editing text
- Coding and debugging
- Analysis and research
- Creative tasks

Be concise but thorough in your responses.`;

export class AgentSession {
  private session: ReturnType<typeof unstable_v2_createSession>;

  constructor() {
    this.session = unstable_v2_createSession({
      model: "claude-haiku-4-5-20251001",
      maxTurns: 100,
      allowedTools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebSearch", "WebFetch"],
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  async sendMessage(content: string) {
    await this.session.send(content);
  }

  async *getOutputStream() {
    for await (const msg of this.session.stream()) {
      yield msg;
    }
  }

  close() {
    this.session.close();
  }
}
