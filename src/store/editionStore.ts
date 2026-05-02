import { create } from "zustand";
import type { Category } from "@/types";

interface EditionState {
  activeSection: Category | "all";
  setActiveSection: (section: Category | "all") => void;
}

export const useEditionStore = create<EditionState>((set) => ({
  activeSection: "all",
  setActiveSection: (section) => set({ activeSection: section }),
}));
