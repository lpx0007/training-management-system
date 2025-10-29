export type NotificationType = 
  | 'registration_pending'
  | 'password_reminder'
  | 'system_alert'
  | 'announcement'
  | 'registration_approved'
  | 'registration_rejected';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  title_template: string;
  content_template: string;
  target_roles: string[] | null;
  is_active: boolean;
  created_at: string;
}
