import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectDriveLink(url?: string) {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const id = url.split("/d/")[1]?.split("/")[0] || url.split("id=")[1]?.split("&")[0];
    if (id) {
      // For images, lh3 is good. For audio/files, uc?export=download is better.
      // We'll use uc?export=download as it's more universal for drive files.
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }
  return url;
}
