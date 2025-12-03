import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ProfileStore {
  profile: Record<string, any> | null;
  setProfile: (data: Record<string, any>) => void;
  updateProfile: (data: Record<string, any>) => void;
  clearProfile: () => void;

  users: Record<string, any> | null;
  setUser: (data: Record<string, any>) => void;
  updateUser: (data: Record<string, any>) => void;
  clearUser: () => void;

  feedback: string;
  setFeedback: (value: string) => void;
  clearFeedback: () => void;

  link: string;
  setLink: (value: string) => void;
  clearLink: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (data) => set({ profile: data }),
      updateProfile: (data) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : state.profile,
        })),
      clearProfile: () => set({ profile: null }),

      users: null,
      setUser: (data) => set({ users: data }),
      updateUser: (data) =>
        set((state) => ({
          users: state.users ? { ...state.users, ...data } : state.users,
        })),
      clearUser: () => set({ users: null }),

      
      feedback: "",
      setFeedback: (value) => set({ feedback: value }),
      clearFeedback: () => set({ feedback: "" }),

      link: "",
      setLink: (value) => set({ link: value }),
      clearLink: () => set({ link: "" }),
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
