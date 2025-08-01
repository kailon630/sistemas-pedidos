export interface CompanySettings {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  CompanyName: string;
  CNPJ: string;
  Address: string;
  Phone: string;
  Email: string;
  Website: string;
  LogoPath: string;
  LogoFilename: string;
}

export interface SystemSettings {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  MinPasswordLength: number;
  RequireUppercase: boolean;
  RequireLowercase: boolean;
  RequireNumbers: boolean;
  RequireSpecialChars: boolean;
  PasswordExpirationDays: number;
  SessionTimeoutMinutes: number;
  BackupEnabled: boolean;
  BackupFrequency: 'daily' | 'weekly' | 'monthly';
  BackupRetention: number;
  LogRetentionDays: number;
  AuditLogEnabled: boolean;
}

export interface UpdateCompanySettingsData {
  companyName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface UpdateSystemSettingsData {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpirationDays: number;
  sessionTimeoutMinutes: number;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  logRetentionDays: number;
  auditLogEnabled: boolean;
}
