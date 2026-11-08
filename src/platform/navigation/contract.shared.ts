/** Общее описание хлебной крошки для чистых функций предметных модулей. */
export interface Breadcrumb {
  label: string;
  href: string;
}

export interface NavigationLink extends Breadcrumb {
  icon?: "tasks" | "attempts" | "members" | "settings";
}

export interface NavigationCourse extends Breadcrumb {
  id: string;
  emoji: string;
}

export type CourseBranchState =
  | { status: "pending" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready";
      tasks: readonly NavigationLink[];
      sections: readonly NavigationLink[];
      refreshing: boolean;
    };
