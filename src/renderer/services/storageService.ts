export interface PetPosition {
  x: number;
  y: number;
}

export interface AppSettings {
  deepseekApiKey: string;
}

const storageKey = "desktop-pet-mvp";

interface StoredData {
  petPosition?: PetPosition;
  settings?: Partial<AppSettings>;
}

export function loadPetPosition(): PetPosition | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const data = raw ? (JSON.parse(raw) as StoredData) : {};
    return data.petPosition ?? null;
  } catch {
    return null;
  }
}

export function savePetPosition(position: PetPosition) {
  const current = getStoredData();
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...current,
      petPosition: position
    })
  );
}

export function loadAppSettings(): AppSettings {
  const data = getStoredData();

  return {
    deepseekApiKey: data.settings?.deepseekApiKey ?? ""
  };
}

export function saveAppSettings(settings: Partial<AppSettings>) {
  const current = getStoredData();
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...current,
      settings: {
        ...current.settings,
        ...settings
      }
    })
  );
}

function getStoredData(): StoredData {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredData) : {};
  } catch {
    return {};
  }
}
