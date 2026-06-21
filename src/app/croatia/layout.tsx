import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Croatia — Split · Korčula · Dubrovnik",
  description:
    "A day-by-day Croatia itinerary you can reshape: swap activities and pull live, source-grounded recommendations for each day.",
};

export default function CroatiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
