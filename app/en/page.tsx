import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "PlayWorld instructions: PlayStation account activation" },
  description: "Simple step-by-step guide for activating the PS4 or PS5 account you bought from the PlayWorld shop.",
  alternates: { canonical: "/en", languages: { sr: "/", en: "/en" } },
};
export default function HomeEn() {
  return <HomePage lang="en" />;
}
