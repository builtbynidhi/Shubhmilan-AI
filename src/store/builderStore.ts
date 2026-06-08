import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Biodata,
  Community,
  PersonalInfo,
  CareerInfo,
  FamilyInfo,
  AboutInfo,
  ContactInfo,
} from "@/types/biodata.types";

interface BuilderStore {
  currentStep: number;
  personal: PersonalInfo;
  career: CareerInfo;
  family: FamilyInfo;
  about: AboutInfo;
  contact: ContactInfo;
  selectedTemplateId: string;
  lastSavedAt: string | null;
  /** id of the backend `biodatas` row this draft maps to (null = not yet saved). */
  savedId: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updatePersonal: (data: Partial<PersonalInfo>) => void;
  updateCareer: (data: Partial<CareerInfo>) => void;
  updateFamily: (data: Partial<FamilyInfo>) => void;
  updateAbout: (data: Partial<AboutInfo>) => void;
  updateContact: (data: Partial<ContactInfo>) => void;
  setSelectedTemplate: (templateId: string) => void;
  markSaved: () => void;
  setSavedId: (id: string | null) => void;
  /** Hydrate the builder from a saved backend biodata (for Open/Edit). */
  loadBiodata: (biodata: Biodata) => void;
  resetBuilder: () => void;
}

const defaultPersonal: PersonalInfo = {
  community: "hindu" as Community,
  fullName: "",
  dateOfBirth: "",
  age: 0,
  height: "",
  complexion: "",
  bloodGroup: "",
  motherTongue: "",
  languagesKnown: [],
  maritalStatus: "never_married",
};

const defaultCareer: CareerInfo = {
  highestEducation: "",
  fieldOfStudy: "",
  college: "",
  employmentType: "salaried",
  companyName: "",
  jobTitle: "",
  annualIncome: "",
  workCity: "",
  workingAbroad: false,
};

const defaultFamily: FamilyInfo = {
  fatherName: "",
  fatherOccupation: "",
  fatherStatus: "",
  motherName: "",
  motherOccupation: "",
  motherStatus: "",
  brothers: 0,
  marriedBrothers: 0,
  sisters: 0,
  marriedSisters: 0,
  familyType: "nuclear",
  familyValues: "moderate",
  nativePlace: "",
  familyCity: "",
};

const defaultAbout: AboutInfo = {
  hobbies: [],
  aboutMe: "",
  partnerExpectations: "",
  diet: "vegetarian",
  smoking: "never",
  drinking: "never",
  physicalDisability: "None",
};

const defaultContact: ContactInfo = {
  contactName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
};

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      personal: defaultPersonal,
      career: defaultCareer,
      family: defaultFamily,
      about: defaultAbout,
      contact: defaultContact,
      selectedTemplateId: "tpl_red_01",
      lastSavedAt: null,
      savedId: null,

      setStep: (step) => set({ currentStep: step }),
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 6),
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      updatePersonal: (data) =>
        set((state) => ({
          personal: { ...state.personal, ...data },
        })),

      updateCareer: (data) =>
        set((state) => ({
          career: { ...state.career, ...data },
        })),

      updateFamily: (data) =>
        set((state) => ({
          family: { ...state.family, ...data },
        })),

      updateAbout: (data) =>
        set((state) => ({
          about: { ...state.about, ...data },
        })),

      updateContact: (data) =>
        set((state) => ({
          contact: { ...state.contact, ...data },
        })),

      setSelectedTemplate: (templateId) =>
        set({ selectedTemplateId: templateId }),

      markSaved: () =>
        set({ lastSavedAt: new Date().toISOString() }),

      setSavedId: (id) => set({ savedId: id }),

      loadBiodata: (biodata) =>
        set((state) => ({
          personal: biodata.formData.personal,
          career: biodata.formData.career,
          family: biodata.formData.family,
          about: biodata.formData.about,
          contact: biodata.formData.contact,
          selectedTemplateId:
            biodata.formData.templateId || state.selectedTemplateId,
          savedId: biodata.id,
          currentStep: 6,
          lastSavedAt: biodata.updatedAt ?? null,
        })),

      resetBuilder: () =>
        set({
          currentStep: 1,
          personal: defaultPersonal,
          career: defaultCareer,
          family: defaultFamily,
          about: defaultAbout,
          contact: defaultContact,
          selectedTemplateId: "tpl_red_01",
          lastSavedAt: null,
          savedId: null,
        }),
    }),
    {
      name: "shubhmilan-builder",
      partialize: (state) => ({
        currentStep: state.currentStep,
        personal: state.personal,
        career: state.career,
        family: state.family,
        about: state.about,
        contact: state.contact,
        selectedTemplateId: state.selectedTemplateId,
        lastSavedAt: state.lastSavedAt,
        savedId: state.savedId,
      }),
    }
  )
);
