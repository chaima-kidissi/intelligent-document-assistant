export type UserRole = 'admin' | 'user';

export interface UserInfo {
  username: string;
  roles: UserRole[];
  isAdmin: boolean;
}

export interface KeycloakUser {
  id: string;
  username: string;
  enabled: boolean;
  createdTimestamp?: number;
  realmRoles?: string[];
}

export interface AdminStats {
  totalUsers: number;
  totalDocuments: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roles: string[];
}
