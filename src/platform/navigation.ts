export interface Breadcrumb {
  label: string;
  to: string;
}

export interface NavigationTask {
  id: bigint;
  name: string;
}

export interface NavigationCourse {
  id: bigint;
  name: string;
  emoji: string;
  canManage: boolean;
  tasks: NavigationTask[];
}

export interface NavigationUser {
  fullName: string;
}
