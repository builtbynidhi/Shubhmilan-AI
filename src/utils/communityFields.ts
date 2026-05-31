import type { Community } from "@/types/biodata.types";

interface CommunityField {
  name: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  required?: boolean;
}

export const communitySpecificFields: Record<Community, CommunityField[]> = {
  hindu: [
    { name: "caste", label: "Caste", type: "text" },
    { name: "subCaste", label: "Sub-Caste", type: "text" },
    { name: "gotra", label: "Gotra", type: "text" },
    {
      name: "manglik",
      label: "Manglik",
      type: "select",
      options: ["Yes", "No", "Partial"],
    },
  ],
  muslim: [
    {
      name: "sect",
      label: "Sect",
      type: "select",
      options: ["Sunni", "Shia", "Other"],
    },
    { name: "maslak", label: "Maslak", type: "text" },
  ],
  christian: [
    {
      name: "denomination",
      label: "Denomination",
      type: "select",
      options: ["Catholic", "Protestant", "Orthodox", "Other"],
    },
  ],
  sikh: [
    { name: "caste", label: "Caste (Optional)", type: "text" },
  ],
  jain: [
    {
      name: "jainSect",
      label: "Sect",
      type: "select",
      options: ["Digambar", "Shwetambar"],
    },
    { name: "caste", label: "Caste", type: "text" },
  ],
  buddhist: [],
};

export const communityIcons: Record<Community, { icon: string; label: string }> = {
  hindu: { icon: "🕉", label: "Hindu" },
  muslim: { icon: "☪", label: "Muslim" },
  christian: { icon: "✝", label: "Christian" },
  sikh: { icon: "🪬", label: "Sikh" },
  jain: { icon: "🔯", label: "Jain" },
  buddhist: { icon: "☸", label: "Buddhist" },
};

export const allCommunities: Community[] = [
  "hindu",
  "muslim",
  "christian",
  "sikh",
  "jain",
  "buddhist",
];
