import type { Metadata } from "next";
import { MockSignInForm } from "@/components/landing/MockSignInForm";
import { SPOKEN_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: `Sign in`,
  description: `Sign in to ${SPOKEN_NAME} — a social network for writers.`,
};

export default function SignInPage() {
  return <MockSignInForm />;
}
