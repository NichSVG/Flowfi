import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.id) {
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: session.user.id },
    });

    if (!onboarding || !onboarding.completed) {
      redirect("/onboarding");
    }
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-3 pt-14 sm:p-4 sm:pt-14 lg:p-6 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
