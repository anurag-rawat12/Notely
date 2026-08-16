import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const { isAuthenticated } = await getAuth();

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-1">
        <LandingPage />
      </main>
    </div>
  );
}
