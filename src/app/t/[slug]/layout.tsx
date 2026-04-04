import { getTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenant(slug);

  if (!tenant) return notFound();

  if (!tenant.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FDF6E3" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🀄</div>
          <h1 className="text-xl font-bold" style={{ color: "#8B0000" }}>服務暫停中</h1>
          <p className="text-sm mt-2" style={{ color: "rgba(139,0,0,0.6)" }}>此館服務暫時停用，請聯繫管理員</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
