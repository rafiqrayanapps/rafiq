import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectLink(url?: string) {
  if (!url) return "";

  // Handle Google Drive
  if (url.includes("drive.google.com")) {
    const id = url.split("/d/")[1]?.split("/")[0] || url.split("id=")[1]?.split("&")[0];
    if (id) {
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }

  // Handle GitHub
  if (url.includes("github.com") && url.includes("/blob/")) {
    // Convert https://github.com/user/repo/blob/branch/path to https://raw.githubusercontent.com/user/repo/branch/path
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  return url;
}

// Keep the old name as alias for compatibility if needed, but we'll update usages
export const getDirectDriveLink = getDirectLink;
