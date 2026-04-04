import { redirect } from "next/navigation";

// 根路由導向超級後台（也可以改為租戶選擇頁）
export default function RootPage() {
  redirect("/superadmin");
}
