import { Search, Shield } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRole = "admin" | "moderator" | "user";
type UserStatus = "active" | "pending";

const mockUsers: {
  id: string;
  email: string;
  role: UserRole | "user";
  status: UserStatus;
  created_at: string;
  last_sign_in_at: string | null;
}[] = [
  {
    id: "8f7c2a91-xxxx-xxxx-xxxx-123456789abc",
    email: "wan@example.com",
    role: "admin",
    status: "active",
    created_at: "2026-08-15T10:30:00Z",
    last_sign_in_at: "2026-08-15T16:42:00Z",
  },
  {
    id: "2a6d91ef-xxxx-xxxx-xxxx-987654321def",
    email: "user@example.com",
    role: "user",
    status: "active",
    created_at: "2026-08-14T08:20:00Z",
    last_sign_in_at: "2026-08-15T14:12:00Z",
  },
];

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Permissions"
        description="Manage users and their access permissions."
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search users..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Users */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last sign in</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                {/* User */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {user.email}
                      </div>

                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {user.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <StatusBadge status={"active"} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>

                {/* Created */}
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {user.created_at}
                </TableCell>

                {/* Last sign in */}
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {user.last_sign_in_at ?? "Never"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}