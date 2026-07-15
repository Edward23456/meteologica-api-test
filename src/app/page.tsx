import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to the Home Page</h1>
    </main>
  );
}
