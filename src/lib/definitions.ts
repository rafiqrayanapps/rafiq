import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  order?: number;
  visibility?: 'public';
  isHidden?: boolean;
  isUnderMaintenance?: boolean;
  showShareButton?: boolean;
  fileTypes?: string;
  displayStyle?: string;
  subCategoryLayout?: 'horizontal' | 'vertical';
  accentColor?: string;
  useCustomAccent?: boolean;
  isNew?: boolean;
  hasNewContent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  downloadUrl?: string;
  downloadUrlLabel?: string;
  downloadUrl2?: string;
  downloadUrl2Label?: string;
  extraLinks?: Array<{ label?: string; url: string }>;
  sourceUrl?: string;
  prompt?: string;
  promptInstructions?: string;
  usedApps?: string[];
  hasMaterials?: boolean;
  materialsUrl?: string;
  materialsLabel?: string;
  materialsDescription?: string;
  showCopyButton?: boolean;
  showDownloadButton?: boolean;
  showShareButton?: boolean;
  order?: number;
  visibility?: 'public';
  status?: 'pending' | 'approved' | 'rejected';
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // App Store specific fields
  rating?: string;
  reviewCount?: string;
  ageRating?: string;
  version?: string;
  size?: string;
  screenshots?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  status: 'approved' | 'rejected' | 'pending';
  createdAt: Timestamp;
  points: number;
  referralCode: string;
  referralCount: number;
  referredBy?: string | null;
  deviceFingerprint: string;
}

export interface WhitelistEntry {
  email: string;
  role: 'admin' | 'editor' | 'user';
  activatedByUid?: string;
}

export interface Blog {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  enabled: boolean;
  postCount?: number;
  lastSync?: string;
  lastStatus?: 'success' | 'error' | 'syncing';
  lastError?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPost {
  id: string;
  blogId: string;
  blogName: string;
  externalId: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  images?: string[];
  publishedAt: string;
  updatedAt?: string;
  originalUrl: string;
  labels: string[];
  author?: string;
  createdAt?: string;
}

export interface CustomPage {
  id: string;
  title: string;
  url: string; // الرابط الخارجي للصفحة
  icon?: string;
  isActive: boolean;
  order?: number;
  slug?: string;
  content?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
