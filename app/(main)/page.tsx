
import { auth } from "@/auth";
import HomePageClient from "@/components/home/HomePageClient";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  return (
    <HomePageClient user={session?.user} />
  );
}
