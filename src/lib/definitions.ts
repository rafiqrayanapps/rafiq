import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  order?: number;
  visibility?: 'public';
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
