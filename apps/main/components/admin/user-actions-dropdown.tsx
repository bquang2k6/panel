"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  toggleUserActiveAction,
  softDeleteUserAction,
  restoreUserAction,
} from "@/app/admin/users/actions";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import type { UserPlan } from "@/lib/types/user-plan";

interface UserActionsDropdownProps {
  user: UserPlan;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = () => {
    startTransition(async () => {
      await toggleUserActiveAction(user.uid, !user.is_active);
    });
  };

  const handleSoftDelete = () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mềm người dùng @${user.username ?? user.uid}?`)) {
      return;
    }
    startTransition(async () => {
      await softDeleteUserAction(user.uid);
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      await restoreUserAction(user.uid);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Hành động</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Xem chi tiết */}
          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            Xem chi tiết
          </DropdownMenuItem>

          {/* Sửa */}
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4 text-amber-500" />
            Chỉnh sửa
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Ban / Unban (Toggle Active) */}
          <DropdownMenuItem onClick={handleToggleActive}>
            {user.is_active ? (
              <>
                <Ban className="mr-2 h-4 w-4 text-orange-500" />
                Khóa tài khoản
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Mở khóa tài khoản
              </>
            )}
          </DropdownMenuItem>

          {/* Xóa mềm / Khôi phục */}
          {user.deleted_at ? (
            <DropdownMenuItem onClick={handleRestore}>
              <RotateCcw className="mr-2 h-4 w-4 text-green-600" />
              Khôi phục tài khoản
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleSoftDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa mềm (Soft Delete)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <UserDetailDialog
        user={user}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <EditUserDialog
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
