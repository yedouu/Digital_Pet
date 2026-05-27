export type MemoryType = "preference" | "habit" | "important_date" | "note";

export interface PetMemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  createdAt: number;
  updatedAt?: number;
  enabled: boolean;
}

export interface PetMemory {
  userNickname?: string;
  memorySummary?: string;
  memories: PetMemoryItem[];
  recentMessages: Array<{
    role: "user" | "assistant";
    content: string;
    createdAt: number;
  }>;
}

const memoryStorageKey = "bubu_pet_memory";
const firstLaunchStorageKey = "bubu_first_launch_seen";

export function loadPetMemory(): PetMemory {
  const raw = window.localStorage.getItem(memoryStorageKey);

  if (!raw) {
    return createDefaultMemory();
  }

  try {
    return {
      ...createDefaultMemory(),
      ...(JSON.parse(raw) as PetMemory)
    };
  } catch {
    return createDefaultMemory();
  }
}

export function savePetMemory(memory: PetMemory) {
  window.localStorage.setItem(memoryStorageKey, JSON.stringify(memory));
}

export function buildMemorySummary(memory: PetMemory): string {
  const enabledMemories = memory.memories
    .filter((item) => item.enabled)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  if (enabledMemories.length === 0) {
    return memory.memorySummary?.trim() || "";
  }

  return enabledMemories
    .map((item, index) => `${index + 1}. [${item.type}] ${item.content}`)
    .join("\n");
}

export function addMemory(memory: PetMemory, content: string, type: MemoryType = inferMemoryType(content)): PetMemory {
  const now = Date.now();

  return {
    ...memory,
    memories: [
      ...memory.memories,
      {
        id: `${now}-${Math.random().toString(36).slice(2)}`,
        type,
        content: content.trim(),
        createdAt: now,
        enabled: true
      }
    ]
  };
}

export function deleteMemory(memory: PetMemory, target?: string): { memory: PetMemory; deletedCount: number } {
  const normalizedTarget = target?.trim().toLowerCase();

  if (!normalizedTarget) {
    return { memory, deletedCount: 0 };
  }

  const nextMemories = memory.memories.filter((item, index) => {
    const position = String(index + 1);
    const content = item.content.toLowerCase();
    return item.id !== normalizedTarget && position !== normalizedTarget && !content.includes(normalizedTarget);
  });

  return {
    memory: {
      ...memory,
      memories: nextMemories
    },
    deletedCount: memory.memories.length - nextMemories.length
  };
}

export function formatMemoryList(memory: PetMemory): string {
  const enabledMemories = memory.memories.filter((item) => item.enabled);

  if (enabledMemories.length === 0) {
    return "Bubu hasn't remembered anything yet.";
  }

  return `Bubu remembers: ${enabledMemories
    .slice(0, 8)
    .map((item, index) => `${index + 1}. ${item.content}`)
    .join("; ")}`;
}

export function parseMemoryIntent(input: string):
  | { type: "add"; content: string }
  | { type: "view" }
  | { type: "delete"; target?: string }
  | null {
  const text = input.trim();

  if (!text) {
    return null;
  }

  if (/^(查看记忆|你记住了什么|布布记住了什么|what do you remember|show memories)\??$/i.test(text)) {
    return { type: "view" };
  }

  const deleteMatch = text.match(/^(删除记忆|忘掉|忘记|不要记住)\s*(.*)$/i);

  if (deleteMatch) {
    return {
      type: "delete",
      target: deleteMatch[2]?.trim()
    };
  }

  const rememberMatch = text.match(/^(记住|布布记住|帮我记住)\s*[:：]?\s*(.+)$/i);

  if (rememberMatch?.[2]?.trim()) {
    return {
      type: "add",
      content: rememberMatch[2].trim()
    };
  }

  return null;
}

export function addRecentMessage(memory: PetMemory, role: "user" | "assistant", content: string): PetMemory {
  const recentMessages = [
    ...memory.recentMessages,
    {
      role,
      content,
      createdAt: Date.now()
    }
  ].slice(-10);

  return {
    ...memory,
    recentMessages
  };
}

export function hasSeenFirstLaunch(): boolean {
  return window.localStorage.getItem(firstLaunchStorageKey) === "true";
}

export function markFirstLaunchSeen() {
  window.localStorage.setItem(firstLaunchStorageKey, "true");
}

export function resetFirstLaunch() {
  window.localStorage.removeItem(firstLaunchStorageKey);
}

function createDefaultMemory(): PetMemory {
  return {
    userNickname: "dear",
    memorySummary: "",
    memories: [],
    recentMessages: []
  };
}

function inferMemoryType(content: string): MemoryType {
  const normalized = content.toLowerCase();

  if (/(喜欢|不喜欢|偏好|prefer|favorite|favourite|like|dislike)/i.test(normalized)) {
    return "preference";
  }

  if (/(每天|经常|习惯|通常|always|usually|habit|routine)/i.test(normalized)) {
    return "habit";
  }

  if (/(\d{1,2}月\d{1,2}日|生日|纪念日|date|birthday|anniversary)/i.test(normalized)) {
    return "important_date";
  }

  return "note";
}
