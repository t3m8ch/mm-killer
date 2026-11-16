import type { Breadcrumb } from "../platform/public.shared.ts";

export type NavigationLink = Breadcrumb & {
  icon?: "tasks" | "attempts" | "members" | "settings";
};

export type NavigationCourse = Breadcrumb & {
  id: string;
  emoji: string;
};

export type CourseBranchState =
  | { status: "pending" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready";
      tasks: readonly NavigationLink[];
      sections: readonly NavigationLink[];
      refreshing: boolean;
    };
