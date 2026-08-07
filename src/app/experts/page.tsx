import type { Metadata } from "next";
import { ExpertsClient } from "./ExpertsClient";

export const metadata: Metadata = {
  title: "Expert directory",
  description: "Browse and vet the network — filter by discipline, check verification and track record, then invite someone into a brief.",
};

export default function Page() {
  return <ExpertsClient />;
}
