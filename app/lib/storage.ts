import { supabase, getBrowserId } from "./supabase";

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

// Map Supabase row to SavedProject
function rowToProject(row: Record<string, unknown>): SavedProject {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    imageDataUrl: row.image_data_url as string,
    thumbnailDataUrl: row.thumbnail_data_url as string,
    scale: row.scale as number,
    rotation: row.rotation as number,
    wallWidthFeet: row.wall_width_feet as number,
    wallHeightFeet: row.wall_height_feet as number,
    tileSize: row.tile_size as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
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

export async function getSavedProjects(): Promise<SavedProject[]> {
  const browserId = getBrowserId();
  const { data, error } = await supabase
    .from("saved_projects")
    .select("*")
    .eq("browser_id", browserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load projects:", error);
    return [];
  }
  return (data || []).map(rowToProject);
}

export async function saveProject(
  project: Omit<SavedProject, "id" | "createdAt" | "updatedAt">
): Promise<SavedProject | null> {
  const browserId = getBrowserId();
  const { data, error } = await supabase
    .from("saved_projects")
    .insert({
      browser_id: browserId,
      name: project.name,
      description: project.description,
      image_data_url: project.imageDataUrl,
      thumbnail_data_url: project.thumbnailDataUrl,
      scale: project.scale,
      rotation: project.rotation,
      wall_width_feet: project.wallWidthFeet,
      wall_height_feet: project.wallHeightFeet,
      tile_size: project.tileSize,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save project:", error);
    return null;
  }
  return rowToProject(data);
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<SavedProject, "id" | "createdAt">>
): Promise<SavedProject | null> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.imageDataUrl !== undefined) updateData.image_data_url = updates.imageDataUrl;
  if (updates.thumbnailDataUrl !== undefined) updateData.thumbnail_data_url = updates.thumbnailDataUrl;
  if (updates.scale !== undefined) updateData.scale = updates.scale;
  if (updates.rotation !== undefined) updateData.rotation = updates.rotation;
  if (updates.wallWidthFeet !== undefined) updateData.wall_width_feet = updates.wallWidthFeet;
  if (updates.wallHeightFeet !== undefined) updateData.wall_height_feet = updates.wallHeightFeet;
  if (updates.tileSize !== undefined) updateData.tile_size = updates.tileSize;

  const { data, error } = await supabase
    .from("saved_projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update project:", error);
    return null;
  }
  return rowToProject(data);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("saved_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete project:", error);
    return false;
  }
  return true;
}

export async function getProjectById(id: string): Promise<SavedProject | null> {
  const { data, error } = await supabase
    .from("saved_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to get project:", error);
    return null;
  }
  return rowToProject(data);
}
