import type {
    RoleRequest,
    RoleResponse,
} from "@/types/role.d.ts";
import { useEffect, useState } from "react";
import { RoleSearchSection } from "./RoleSearchSection";
import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
import Pagination from "@/components/rickTexts/Pagination.tsx";
import {
    deleteRoleById,
    findAllRoles,
    saveRole,
    updateRoleById,
} from "@/services/roleApi.ts";
import { toast } from "sonner";
import { getErrorMessage } from "@/features/slices/authThunk.ts";
import { RoleTable } from "./RoleTable";
import { RoleForm } from "./RoleForm";
import { findAllPermissionsNoPaging } from "@/services/permissionApi";
import type { PermissionResponse } from "@/types/permision.d.ts";
import HasPermission from "@/page/commons/HasPermission";

const RoleManagerPage = () => {
    // Data
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Search
    const [searchRoleName, setSearchRoleName] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // ============================
    // Dialog State
    // ============================
    const [isDialogOpen, setisDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] =
        useState<RoleResponse | null>(null);

    const handleOpenCreateForm = () => {
        setSelectedRole(null);
        setisDialogOpen(true);
    };

    const handleOpenEditForm = (role: RoleResponse) => {
        setSelectedRole(role);
        setisDialogOpen(true);
    };

    // ============================
    // HANDLE FETCHING DATA
    // ============================
    const fetchRoles = async (
        page: number,
        size: number,
        searchRoleName: string,
    ) => {
        setIsLoading(true);

        try {
            const filters: string[] = [];

            if (searchRoleName) filters.push(`name ~ '*${searchRoleName}*'`);

            const keyword = filters.length > 0 ? filters.join(" and ") : null;

            // Convert 1-based page to 0-based for API
            const res = (await findAllRoles({ page: page - 1, size, keyword })).data.data;
            if (res) {
                setRoles(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Không thể lấy danh sách công ty."));
        } finally {
            setIsLoading(false);
        }
    };

    // Reset về page 1 khi filter thay đổi
    useEffect(() => {
        void fetchRoles(1, itemsPerPage, searchRoleName);
        setCurrentPage(1);
    }, [itemsPerPage, searchRoleName]);

    // Fetch data khi currentPage thay đổi
    useEffect(() => {
        void fetchRoles(currentPage, itemsPerPage, searchRoleName);
    }, [currentPage]);

    useEffect(() => {
        const fetchPermissions = async () => {
            setIsLoading(true);

            try {
                const res = (await findAllPermissionsNoPaging()).data;
                if (res.data) {
                    setPermissions(res.data);
                }
            } catch (err) {
                toast.error(getErrorMessage(err, "Không thể lấy danh sách công ty."));
            } finally {
                setIsLoading(false);
            }
        };

        void fetchPermissions();
    }, []);

    // ============================
    // HANDLE RESET
    // ============================
    const handleReset = () => {
        setSearchRoleName("");
        setCurrentPage(1);
    };

    // ============================
    // HANDLE CREATE OR UPDATE
    // ============================
    const handleSubmitUpsert = async (
        data: RoleRequest,
        id?: number,
    ) => {
        try {
            setIsLoading(true);

            if (id) {
                await updateRoleById(id, data);
                await fetchRoles(1, itemsPerPage, searchRoleName);
                toast.success("Cập nhật chức vụ mới thành công");
            } else {
                await saveRole(data);
                await fetchRoles(1, itemsPerPage, searchRoleName);
                toast.success("Tạo chức vụ mới thành công");
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsLoading(false);
        }
    };

    // ============================
    // HANDLE DELETE
    // ============================
    const handleDelete = async (id: number) => {
        try {
            setIsLoading(true);

            await deleteRoleById(id);
            await fetchRoles(1, itemsPerPage, searchRoleName);

            toast.success("Xóa chức vụ thành công");
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <HasPermission perm={"GET /api/roles"}>
            <div className="space-y-6">
                <RoleSearchSection
                    searchRoleName={searchRoleName}
                    setSearchRoleName={setSearchRoleName}
                    onReset={handleReset}
                />
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên vai trò..."
                                value={searchRoleName}
                                onChange={(e) => setSearchRoleName(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <button
                            onClick={handleReset}
                            className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Danh sách chức vụ</h2>
                    <HasPermission perm={"POST /api/roles"}>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleOpenCreateForm}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm chức vụ
                        </Button>
                    </HasPermission>
                </div>

                <RoleTable
                    roles={roles}
                    isLoading={isLoading}
                    onEdit={handleOpenEditForm}
                    onDelete={handleDelete}
                />

                <Pagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    showItemsPerPageSelect={true}
                />

                <RoleForm
                    open={isDialogOpen}
                    onOpenChange={setisDialogOpen}
                    initialData={selectedRole}
                    onSubmit={handleSubmitUpsert}
                    onCloseForm={() => setSelectedRole(null)}
                    permissions={permissions}
                />
            </div>
        </HasPermission>
    );
};

export default RoleManagerPage;
