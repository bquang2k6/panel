import { UserCacheEditor } from "@/components/admin/user-cache-editor";

export const dynamic = "force-dynamic";

export default function CachePage() {
  return (
    <div className="flex flex-col gap-6">
      <UserCacheEditor />
    </div>
  );
}
