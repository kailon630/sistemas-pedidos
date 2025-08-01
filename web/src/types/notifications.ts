export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any; // dados específicos da notificação
}

export type NotificationType = 
  | 'new-product-request'
  | 'product-request-processed'
  | 'request-approved'
  | 'request-rejected'
  | 'request-completed'
  | 'budget-received'
  | 'item-received'
  | 'system';

export interface NotificationSettings {
  enabled: boolean;
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      sound: boolean;
    };
  };
  frequency: 'immediate' | 'hourly' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}