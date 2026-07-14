export type MBTIType =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

export type UserPreference = {
  mbti?: MBTIType | "unknown";
  adviceStyle: "best_one" | "two_or_three_options" | "full_analysis";
  reminderStyle: "light" | "standard" | "repeated";
  planDetailLevel: "brief" | "normal" | "detailed";
  diet?: {
    taste?: "light" | "medium_spicy" | "heavy_spicy";
    avoid?: string[];
    budget?: "economy" | "moderate" | "flexible";
  };
  exercise?: {
    preferredTypes?: string[];
    intensity?: "light" | "moderate" | "high";
  };
  outfit?: {
    style?: "minimal" | "casual" | "commute" | "colorful";
    colorPreference?: "light" | "dark" | "neutral" | "colorful";
  };
  commute?: {
    preferredMethod?: "walk" | "bike" | "subway" | "taxi" | "drive";
    defaultBufferMinutes?: number;
  };
};
