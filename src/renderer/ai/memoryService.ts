export interface PetMemory {
  userNickname?: string;
  memorySummary?: string;
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
    recentMessages: []
  };
}
