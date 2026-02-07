// Original: src/context/ProjectsContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectsContextValue {
  projects: Project[];
  selectedProject: Project | null;
  selectProject: (projectId: string) => void;
  clearProjectSelection: () => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const selectProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId) ?? null;
      setSelectedProject(project);
    },
    [projects]
  );

  const clearProjectSelection = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const value = useMemo(
    () => ({ projects, selectedProject, selectProject, clearProjectSelection }),
    [projects, selectedProject, selectProject, clearProjectSelection]
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
