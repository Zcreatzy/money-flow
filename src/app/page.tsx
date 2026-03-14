import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { getDailyTrends } from "@/lib/data";

// This is a Server Component by default
export default async function Home() {
  // Fetch data on the server (avoids CORS)
  const trendData = await getDailyTrends();

  return (
    <>
      <Navbar />
      <main>
        <Dashboard data={trendData} />
      </main>
    </>
  );
}
