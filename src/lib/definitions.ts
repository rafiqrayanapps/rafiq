import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  order?: number;
  visibility?: 'public';
  isUnderMaintenance?: boolean;
  fileTypes?: string;
  displayStyle?: string;
  subCategoryLayout?: 'horizontal' | 'vertical';
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  downloadUrl?: string;
  sourceUrl?: string;
  prompt?: string;
  showCopyButton?: boolean;
  showDownloadButton?: boolean;
  order?: number;
  visibility?: 'public';
  status?: 'pending' | 'approved' | 'rejected';
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
