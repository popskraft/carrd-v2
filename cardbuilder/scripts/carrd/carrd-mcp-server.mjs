#!/usr/bin/env node

import readline from "node:readline";

import {
  checkProfile,
  listProfiles,
  readTarget,
  resolveTarget,
  syncProfile,
  updateTarget
} from "./lib/control-core.mjs";

const SERVER_INFO = {
  name: "carrd-builder-mcp",
  version: "0.1.0"
};

const SUPPORTED_PROTOCOL_VERSION = "2025-11-25";

function buildInstructions() {
  return [
    "Use list_profiles first, then check_profile for the target site.",
    "Use resolve_target before read_target or update_target.",
    "For update_target, pass commit=true only after checking the returned allowlisted path and expectedBefore value.",
    "This server never publishes Carrd sites and respects operator-only save/publish policy."
  ].join(" ");
}

function createResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function createError(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data })
    }
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function toolTextSummary(name, payload) {
  if (name === "list_profiles") {
    return `Profiles: ${payload.profiles.map((item) => item.siteSlug).join(", ")}`;
  }
  if (name === "check_profile") {
    return `Profile ${payload.siteSlug}: safeToEdit=${payload.safeToEdit}`;
  }
  if (name === "resolve_target") {
    return `Target resolution: ${payload.resolution.status}`;
  }
  if (name === "read_target") {
    return `Read target ${payload.resolution?.target?.semanticKey || "unknown"}`;
  }
  if (name === "update_target") {
    return `Update target ${payload.resolution?.target?.semanticKey || "unknown"} commit=${payload.mutation?.commit === true}`;
  }
  if (name === "sync_profile") {
    return `Synced profile ${payload.siteSlug} targets=${payload.targetCount}`;
  }
  return name;
}

function createToolResult(name, payload, isError = false) {
  return {
    content: [
      {
        type: "text",
        text: toolTextSummary(name, payload)
      }
    ],
    structuredContent: payload,
    isError
  };
}

const TOOL_DEFINITIONS = [
  {
    name: "list_profiles",
    description: "List registered Carrd Builder profiles and MCP readiness metadata.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "check_profile",
    description: "Run readiness checks for one Carrd Builder profile without mutating the site.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string" },
        port: { type: "string" }
      },
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "sync_profile",
    description: "Read live Builder state for the configured MCP targets and optionally persist refreshed target metadata.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string" },
        port: { type: "string" },
        live: { type: "boolean" },
        write: { type: "boolean" }
      },
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "resolve_target",
    description: "Resolve a semantic target deterministically from semanticKey, componentId, or a fuzzy query.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string" },
        semanticKey: { type: "string" },
        componentId: { type: "string" },
        query: { type: "string" }
      },
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "read_target",
    description: "Read live Builder state for one exact semantic target.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string" },
        semanticKey: { type: "string" },
        componentId: { type: "string" },
        query: { type: "string" },
        port: { type: "string" }
      },
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "update_target",
    description: "Preflight and optionally mutate one allowlisted field on one exact semantic target. Set commit=true to write.",
    inputSchema: {
      type: "object",
      properties: {
        site: { type: "string" },
        semanticKey: { type: "string" },
        componentId: { type: "string" },
        query: { type: "string" },
        port: { type: "string" },
        path: { type: "string" },
        value: {},
        expectedBefore: {},
        commit: { type: "boolean" }
      },
      required: ["path", "value"],
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  }
];

async function handleToolCall(params) {
  const toolName = params?.name;
  const args = params?.arguments || {};

  switch (toolName) {
    case "list_profiles":
      return { profiles: listProfiles() };
    case "check_profile":
      return checkProfile(args);
    case "sync_profile":
      return syncProfile(args);
    case "resolve_target":
      return resolveTarget(args);
    case "read_target":
      return readTarget(args);
    case "update_target":
      return updateTarget(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function handleRequest(message) {
  const id = message.id;
  const method = message.method;

  if (method === "server/discover") {
    return createResponse(id, {
      supportedVersions: [SUPPORTED_PROTOCOL_VERSION],
      capabilities: {
        tools: {}
      },
      serverInfo: SERVER_INFO,
      instructions: buildInstructions()
    });
  }

  if (method === "initialize") {
    return createResponse(id, {
      protocolVersion: SUPPORTED_PROTOCOL_VERSION,
      capabilities: {
        tools: {}
      },
      serverInfo: SERVER_INFO,
      instructions: buildInstructions()
    });
  }

  if (method === "ping") {
    return createResponse(id, {});
  }

  if (method === "notifications/initialized") {
    return null;
  }

  if (method === "tools/list") {
    return createResponse(id, {
      tools: TOOL_DEFINITIONS
    });
  }

  if (method === "tools/call") {
    const payload = await handleToolCall(message.params || {});
    return createResponse(id, createToolResult(message.params?.name, payload, false));
  }

  return createError(id, -32601, `Method not found: ${method}`);
}

async function onLine(line) {
  if (!line.trim()) return;

  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    send(createError(null, -32700, "Parse error", error.message));
    return;
  }

  if (!message || message.jsonrpc !== "2.0" || !message.method) {
    send(createError(message?.id ?? null, -32600, "Invalid Request"));
    return;
  }

  try {
    const response = await handleRequest(message);
    if (response) {
      send(response);
    }
  } catch (error) {
    const payload = createToolResult(
      message.params?.name || message.method,
      {
        error: error && error.message ? error.message : String(error)
      },
      true
    );
    if (message.method === "tools/call" && message.id !== undefined) {
      send(createResponse(message.id, payload));
      return;
    }
    send(
      createError(
        message.id ?? null,
        -32000,
        error && error.message ? error.message : "Server error"
      )
    );
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
  terminal: false
});

rl.on("line", (line) => {
  onLine(line).catch((error) => {
    send(createError(null, -32000, error && error.message ? error.message : "Server error"));
  });
});
