import type { Metadata } from "next";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { SPOKEN_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: `Setup`,
  description: `Set up your ${SPOKEN_NAME} — a social desktop for writers.`,
};

export default function SetupPage() {
  return <SetupWizard />;
}
