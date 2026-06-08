export interface ExtraField {
  label: string;
  value: string;
}

export type Community = "hindu" | "muslim" | "christian" | "sikh" | "jain" | "buddhist";

export type MaritalStatus = "never_married" | "divorced" | "widowed" | "awaiting_divorce";

export type EmploymentType =
  | "salaried"
  | "business"
  | "government"
  | "doctor"
  | "lawyer"
  | "not_working"
  | "student";

export type FamilyType = "nuclear" | "joint" | "extended";
export type FamilyValues = "traditional" | "moderate" | "liberal";

export type Diet =
  | "vegetarian"
  | "non_vegetarian"
  | "occasionally_non_veg"
  | "eggetarian";

export type Frequency = "never" | "occasionally" | "yes";

export type ManglikStatus = "yes" | "no" | "partial";

export interface PersonalInfo {
  community: Community;
  photoUrl?: string;
  secondPhotoUrl?: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  height: string;
  weight?: number;
  complexion: string;
  bloodGroup: string;
  motherTongue: string;
  languagesKnown: string[];
  maritalStatus: MaritalStatus;
  // Hindu-specific
  caste?: string;
  subCaste?: string;
  gotra?: string;
  manglik?: ManglikStatus;
  // Muslim-specific
  sect?: string;
  maslak?: string;
  // Christian-specific
  denomination?: string;
  // Jain-specific
  jainSect?: string;
  extraFields?: ExtraField[];
}

export interface CareerInfo {
  highestEducation: string;
  fieldOfStudy: string;
  college: string;
  additionalQualifications?: string;
  employmentType: EmploymentType;
  companyName: string;
  jobTitle: string;
  annualIncome: string;
  workCity: string;
  workingAbroad: boolean;
  countryOfResidence?: string;
  visaType?: string;
  openToReturnIndia?: boolean;
  extraFields?: ExtraField[];
}

export interface FamilyInfo {
  fatherName: string;
  fatherOccupation: string;
  fatherStatus: string;
  motherName: string;
  motherOccupation: string;
  motherStatus: string;
  brothers: number;
  marriedBrothers: number;
  sisters: number;
  marriedSisters: number;
  familyType: FamilyType;
  familyValues: FamilyValues;
  nativePlace: string;
  familyCity: string;
  aboutFamily?: string;
  extraFields?: ExtraField[];
}

export interface AboutInfo {
  hobbies: string[];
  aboutMe: string;
  partnerExpectations: string;
  diet: Diet;
  smoking: Frequency;
  drinking: Frequency;
  physicalDisability: string;
  extraFields?: ExtraField[];
}

export interface ContactInfo {
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  extraFields?: ExtraField[];
}

export interface BiodataFormData {
  personal: PersonalInfo;
  career: CareerInfo;
  family: FamilyInfo;
  about: AboutInfo;
  contact: ContactInfo;
  templateId: string;
}

export interface Biodata {
  id: string;
  userId: string;
  title: string;
  community: Community;
  templateId: string;
  formData: BiodataFormData;
  aiEnhanced: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateTier = "free" | "standard" | "premium" | "luxury";
export type TemplateCategory = "hindu" | "muslim" | "christian" | "sikh" | "modern";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  tier: TemplateTier;
  priceInr: number;
  previewImageUrl: string | null;
  thumbnailUrl: string | null;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}
