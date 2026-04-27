export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string; // Optional as it might be null
  status: string;
  roleName: string;
  roleDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // page index (0-based)
  first: boolean;
  last: boolean;
  empty: boolean;
}
