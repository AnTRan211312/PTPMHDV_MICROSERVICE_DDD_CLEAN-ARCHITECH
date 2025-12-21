
import { Trash2, CheckCircle, ShieldAlert, Lock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog.tsx";
import { EmptyState } from "@/components/rickTexts/EmptyState.tsx";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner.tsx";
import { formatISO } from "@/utils/convertHelper.ts";

import type { UserResponse } from "@/types/user";
import HasPermission from "@/page/commons/HasPermission";
import { useAppSelector } from "@/features/hooks.ts";

interface UserTableProps {
    users: UserResponse[];
    isLoading: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

// Mock logic for status
const getUserStatus = (_user: UserResponse) => {
    return { label: "Hoạt động", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle };
};

export function UserTable({
    users,
    isLoading,
    onEdit,
    onDelete,
}: UserTableProps) {
    const { isLogin, user } = useAppSelector((state) => state.auth);

    const hasUpdatePerm = isLogin && user?.permissions?.includes("PUT /api/users");
    const hasDeletePerm = isLogin && user?.permissions?.includes("DELETE /api/users/{id}");
    const hasAnyActionPerm = hasUpdatePerm || hasDeletePerm;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
            <Table>
                <TableHeader className="bg-gray-100 border-b border-gray-200">
                    <TableRow className="hover:bg-transparent border-gray-200">
                        <TableHead className="w-[50px] font-bold text-gray-700 pl-4">#</TableHead>
                        <TableHead className="font-bold text-gray-700">Người dùng</TableHead>
                        <TableHead className="font-bold text-gray-700">Trạng thái</TableHead>
                        <TableHead className="font-bold text-gray-700">Ngày tạo</TableHead>
                        <TableHead className="font-bold text-gray-700 text-right pr-6">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                                    <LoadingSpinner />
                                    <span className="text-sm">Đang tải danh sách...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5}>
                                <EmptyState
                                    title="Không tìm thấy người dùng"
                                    description="Thử thay đổi bộ lọc hoặc thêm người dùng mới."
                                    icon={
                                        <ShieldAlert className="text-slate-200 mb-4 h-12 w-12" />
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user, index) => {
                            const status = getUserStatus(user);
                            const StatusIcon = status.icon;

                            return (
                                <TableRow key={user.id} className="group hover:bg-blue-50/50 even:bg-gray-50/50 transition-colors border-gray-100">
                                    <TableCell className="pl-4 font-mono text-xs font-semibold text-gray-500">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                {user.name.slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{user.name}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${status.color} border gap-1 shadow-sm px-2.5 py-0.5 rounded-full font-normal`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatISO(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        {hasAnyActionPerm ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <HasPermission perm={"PUT /api/users"}>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all shadow-sm"
                                                        onClick={() => onEdit(user.id)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </HasPermission>
                                                <HasPermission perm={"DELETE /api/users/{id}"}>
                                                    <DeleteConfirmDialog onConfirm={() => onDelete(user.id)}>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-500 bg-red-50/80 hover:bg-red-100 hover:text-red-600 border border-red-100 transition-all shadow-sm"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DeleteConfirmDialog>
                                                </HasPermission>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1 text-slate-300">
                                                <Lock className="h-3 w-3" />
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
