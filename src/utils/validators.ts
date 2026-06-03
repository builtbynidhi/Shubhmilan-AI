import { z } from "zod";

const extraFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
});

export const personalInfoSchema = z.object({
  community: z.enum(["hindu", "muslim", "christian", "sikh", "jain", "buddhist"]),
  photoUrl: z.string().optional(),
  secondPhotoUrl: z.string().optional(),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((s) => {
      const t = new Date(s).getTime();
      return !Number.isNaN(t) && t <= Date.now();
    }, "Date of birth cannot be in the future")
    .refine((s) => {
      const t = new Date(s).getTime();
      const hundredYearsAgo = Date.now() - 100 * 365.25 * 86400_000;
      return Number.isNaN(t) || t >= hundredYearsAgo;
    }, "Please enter a realistic date of birth"),
  age: z.number().min(18, "Must be at least 18 years old").max(100),
  height: z.string().min(1, "Height is required"),
  weight: z.number().optional(),
  complexion: z.string().min(1, "Complexion is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  motherTongue: z.string().min(1, "Mother tongue is required"),
  languagesKnown: z.array(z.string()).min(1, "Select at least one language"),
  maritalStatus: z.enum(["never_married", "divorced", "widowed", "awaiting_divorce"]),
  // Community-specific optional fields
  caste: z.string().optional(),
  subCaste: z.string().optional(),
  gotra: z.string().optional(),
  manglik: z.enum(["yes", "no", "partial"]).optional(),
  sect: z.string().optional(),
  maslak: z.string().optional(),
  denomination: z.string().optional(),
  jainSect: z.string().optional(),
  extraFields: z.array(extraFieldSchema).optional(),
});

export const careerInfoSchema = z.object({
  highestEducation: z.string().min(1, "Education is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  college: z.string().min(1, "College/University is required"),
  additionalQualifications: z.string().optional(),
  employmentType: z.enum([
    "salaried",
    "business",
    "government",
    "doctor",
    "lawyer",
    "not_working",
    "student",
  ]),
  companyName: z.string().min(1, "Company/Business name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  annualIncome: z.string().min(1, "Annual income is required"),
  workCity: z.string().min(1, "Work city is required"),
  workingAbroad: z.boolean(),
  countryOfResidence: z.string().optional(),
  visaType: z.string().optional(),
  openToReturnIndia: z.boolean().optional(),
  extraFields: z.array(extraFieldSchema).optional(),
});

export const familyInfoSchema = z.object({
  fatherName: z.string().min(2, "Father's name is required"),
  fatherOccupation: z.string().min(1, "Father's occupation is required"),
  fatherStatus: z.string().min(1, "Father's status is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  motherOccupation: z.string().min(1, "Mother's occupation is required"),
  motherStatus: z.string().min(1, "Mother's status is required"),
  brothers: z.number().min(0).max(10),
  marriedBrothers: z.number().min(0).max(10),
  sisters: z.number().min(0).max(10),
  marriedSisters: z.number().min(0).max(10),
  familyType: z.enum(["nuclear", "joint", "extended"]),
  familyValues: z.enum(["traditional", "moderate", "liberal"]),
  nativePlace: z.string().min(1, "Native place is required"),
  familyCity: z.string().min(1, "Family city is required"),
  aboutFamily: z.string().max(200).optional(),
  extraFields: z.array(extraFieldSchema).optional(),
});

export const aboutInfoSchema = z.object({
  hobbies: z.array(z.string()).min(1, "Add at least one hobby"),
  aboutMe: z.string().min(50, "About Me should be at least 50 characters").max(500),
  partnerExpectations: z.string().min(50, "Expectations should be at least 50 characters").max(500),
  diet: z.enum([
    "vegetarian",
    "non_vegetarian",
    "occasionally_non_veg",
    "jain_vegetarian",
    "eggetarian",
  ]),
  smoking: z.enum(["never", "occasionally", "yes"]),
  drinking: z.enum(["never", "occasionally", "yes"]),
  physicalDisability: z.string(),
  extraFields: z.array(extraFieldSchema).optional(),
});

export const contactInfoSchema = z.object({
  contactName: z.string().min(2, "Contact name is required"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email("Please enter a valid email"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  extraFields: z.array(extraFieldSchema).optional(),
});

export const kundliFormSchema = z.object({
  subjectName: z.string().min(2, "Name is required"),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((s) => {
      const t = new Date(s).getTime();
      return !Number.isNaN(t) && t <= Date.now();
    }, "Birth date cannot be in the future"),
  birthTime: z.string().optional(),
  birthPlace: z.string().min(2, "Birth place is required"),
  chartStyle: z.enum(["north_indian", "south_indian"]),
});

export const authLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authRegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
