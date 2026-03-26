export interface SavedProject {
  id: string;
  name: string;
  description: string;
  imageDataUrl: string;
  thumbnailDataUrl: string;
  scale: number;
  rotation: number;
  wallWidthFeet: number;
  wallHeightFeet: number;
  tileSize: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "patternlab_saved_projects";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createThumbnail(img: HTMLImageElement, maxSize = 300): string {
  const canvas = document.createElement("canvas");
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function getSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export function saveProject(project: Omit<SavedProject, "id" | "createdAt" | "updatedAt">): SavedProject {
  const projects = getSavedProjects();
  const now = new Date().toISOString();
  const newProject: SavedProject = {
    ...project,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  projects.unshift(newProject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return newProject;
}

export function updateProject(id: string, updates: Partial<Omit<SavedProject, "id" | "createdAt">>): SavedProject | null {
  const projects = getSavedProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects[index];
}

export function deleteProject(id: string): boolean {
  const projects = getSavedProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getProjectById(id: string): SavedProject | null {
  const projects = getSavedProjects();
  return projects.find((p) => p.id === id) || null;
}
