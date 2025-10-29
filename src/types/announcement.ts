export type AnnouncementPriority = 'urgent' | 'important' | 'normal';
export type AnnouncementStatus = 'active' | 'archived' | 'draft';
export type UserRole = 'admin' | 'salesperson' | 'expert';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  target_roles: UserRole[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  is_pinned: boolean;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  target_roles?: UserRole[] | null;
  expires_at?: string | null;
  is_pinned?: boolean;
}

export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
  id: string;
}
