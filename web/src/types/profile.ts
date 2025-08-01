export interface UserProfile {
  ID: number;
  Name: string;
  Email: string;
  Role: 'admin' | 'requester';
  SectorID: number;
  Sector: {
    ID: number;
    Name: string;
  };
  CreatedAt: string;
  UpdatedAt: string;
}

export interface UpdateProfileData {
  name: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (muito fraca a muito forte)
  feedback: string[];
}

