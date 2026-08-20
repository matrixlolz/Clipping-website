import { redirect } from "next/navigation";

interface Props {
  params: { experienceId: string };
}

// Always land on the dashboard first. DashboardClient will client-side redirect
// customers to /home once the local auth role is known.
export default function ExperiencePage({ params }: Props) {
  redirect(`/experiences/${params.experienceId}/dashboard`);
}
