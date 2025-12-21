import { Edit, KeyRound, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/rickTexts/DeleteConfirmDialog";
import { EmptyState } from "@/components/rickTexts/EmptyState";
import LoadingSpinner from "@/components/rickTexts/LoadingSpinner";
import { formatISO } from "@/utils/convertHelper.ts";
import type { PermissionResponse } from "@/types/permision";
import { Badge } from "@/components/ui/badge";
import { getMethodColor } from "@/utils/tagColorMapper.tsx";
import HasPermission from "@/page/commons/HasPermission";

import { useAppSelector } from "@/features/hooks.ts";

interface PermissionTableProps {
    permissions: PermissionResponse[];
    isLoading: boolean;
    onEdit: (skill: PermissionResponse) => void;
    onDelete: (id: number) => void;
}

export function PermissionTable({
    permissions,
    isLoading,
    onEdit,
    onDelete,
}: PermissionTableProps) {
    const { isLogin, user } = useAppSelector((state) => state.auth);

    const hasUpdatePerm = isLogin && user?.permissions?.includes("PUT /api/permissions/{id}");
    const hasDeletePerm = isLogin && user?.permissions?.includes("DELETE /api/permissions/{id}");
    const hasAnyActionPerm = hasUpdatePerm || hasDeletePerm;

    return (
        <div className="overflow-hidden rounded-lg border border-blue-600">
            <Table>
                <TableHeader className="bg-blue-600 text-white">
                    <TableRow>
                        <TableHead className="text-center font-bold text-white">
                            ID
                        </TableHead>
                        <TableHead className="w-[300px] text-center font-bold text-white">
                            Tên quyền hạn
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Đường dẫn API
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Phương thức
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Module
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Ngày tạo
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Cập nhật
                        </TableHead>
                        <TableHead className="text-center font-bold text-white">
                            Hành động
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={8}>
                                <div className="flex justify-center py-6">
                                    <LoadingSpinner />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : permissions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8}>
                                <EmptyState
                                    title="Không tìm thấy quyền hạn nào"
                                    description="Thử thay đổi tiêu chí tìm kiếm hoặc thêm quyền hạn mới"
                                    icon={
                                        <KeyRound className="text-muted-foreground mb-4 h-12 w-12" />
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        permissions.map((permission) => (
                            <TableRow key={permission.id}>
                                <TableCell className="text-center">{permission.id}</TableCell>
                                <TableCell className="w-[300px] text-center break-all whitespace-normal">
                                    {permission.name}
                                </TableCell>
                                <TableCell className="text-center">
                                    {permission.apiPath}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={getMethodColor(permission.method)}>
                                        {permission.method}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {permission.module}
                                </TableCell>
                                <TableCell className="text-center">
                                    {formatISO(permission.createdAt)}
                                </TableCell>
                                <TableCell className="text-center">
                                    {permission.updatedAt ? formatISO(permission.updatedAt) : (permission.createdAt ? formatISO(permission.createdAt) : "—")}
                                </TableCell>
                                <TableCell>
                                    {hasAnyActionPerm ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <HasPermission perm={"PUT /api/permissions/{id}"}>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-orange-500 hover:text-orange-600"
                                                    onClick={() => onEdit(permission)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </HasPermission>
                                            <HasPermission perm={"DELETE /api/permissions/{id}"}>
                                                <DeleteConfirmDialog
                                                    onConfirm={() => onDelete(permission.id)}
                                                >
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </DeleteConfirmDialog>
                                            </HasPermission>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1 text-gray-400">
                                            <Lock className="h-4 w-4" />
                                            <span className="text-xs">Không có quyền</span>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
