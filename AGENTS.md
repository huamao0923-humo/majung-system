<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 麻將館預約系統 開發規範

## 多租戶架構規則

### API 安全
- 所有 API route 必須驗證 `session.user.tenantId`，任何資料庫查詢都要加 `tenantId` 過濾
- 新增 API 的標準模式：`/api/t/[slug]/` 路由，使用 `requireAdmin(slug)` 或 `requireTenant(slug)` 驗證（位於 `src/lib/tenant.ts`）
- 舊路由 `/api/timeslots`、`/api/tables`、`/api/floors` 等已棄用，新功能一律走 `/api/t/[slug]/`
- Superadmin 沒有 `tenantId`，不應使用舊的 admin API

### Session 結構
```ts
session.user = {
  id: string,          // User.id (DB primary key)
  role: string,        // "member" | "admin" | "superadmin"
  lineUserId: string,  // LINE userId 或 demo_*/manual_* 前綴
  tenantId: string,    // Tenant.id（superadmin 無此欄）
  tenantSlug?: string, // Tenant.slug（admin credentials 登入時有）
  phone?: string,
}
```

### 路由架構
| 路由 | 說明 | 保護方式 |
|------|------|---------|
| `/t/[slug]/admin/*` | 租戶後台（新） | middleware + `requireAdmin` |
| `/t/[slug]/(member)/*` | 會員頁面 | middleware（reserve/profile/my-reservations 需登入） |
| `/admin/*` | 舊後台（已棄用） | middleware redirect 到新路由 |
| `/superadmin/*` | 超級後台 | middleware（需 superadmin role） |

## Demo 登入
- `demo-login` 使用固定 `lineUserId: demo_{role}_fixed`（findFirst + create，不重複建立）
- 清除測試會員：`DELETE /api/t/[slug]/members`（過濾 `lineUserId startsWith "demo_"`）
- 手動建立的會員 `lineUserId` 格式：`manual_{timestamp}_{random}`

## Prisma / 資料庫
- 部署用 `prisma db push`（非 `migrate deploy`），schema 變更會在 Railway 啟動時自動套用
- Cascade delete 已設定：刪除 User/Table/TimeSlot 會連帶刪除相關 Reservation 與 WaitlistEntry
- 新增關聯時，除非有明確需求，預設都加 `onDelete: Cascade`

## 環境變數
| 變數 | 用途 | 備註 |
|------|------|------|
| `DATABASE_URL` | Neon PostgreSQL | 格式：`postgresql://...?sslmode=require` |
| `NEXTAUTH_SECRET` | Session 加密 | 生產環境未設定會 throw |
| `LINE_CHANNEL_ID/SECRET` | LINE Login | 全域預設租戶用 |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | LINE 推播 | |
