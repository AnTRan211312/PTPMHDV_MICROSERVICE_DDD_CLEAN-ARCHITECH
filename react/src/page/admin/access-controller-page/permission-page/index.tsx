import { getErrorMessage } from "@/features/slices/authThunk";
import {
    deletePermissionById,
    findAllPermissions,
    savePermission,
    updatePermissionById,
} from "@/services/permissionApi";
import type {
    PermissionRequest,
    PermissionResponse,
} from "@/types/permision.d.ts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PermissionSearchSection } from "./PermissionSearchSection";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Pagination from "@/components/rickTexts/Pagination";
import { PermissionTable } from "./PermissionTable";
import { PermissionForm } from "./PermissionForm";
import HasPermission from "@/page/commons/HasPermission";


const PermissionManagerPage = () => {
    // Data
    const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Search
    const [searchName, setSearchName] = useState("");
    const [searchApiPath, setsearchApiPath] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // ============================
    // Dialog State
    // ============================
    const [isDialogOpen, setisDialogOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] =
        useState<PermissionResponse | null>(null);

    const handleOpenCreateForm = () => {
        setSelectedPermission(null);
        setisDialogOpen(true);
    };

    const handleOpenEditForm = (permission: PermissionResponse) => {
        setSelectedPermission(permission);
        setisDialogOpen(true);
    };

    // ============================
    // HANDLE FETCHING DATA
    // ============================
    const fetchPermissions = async (
        page: number,
        size: number,
        searchName: string,
        searchApiPath: string,
    ) => {
        setIsLoading(true);

        try {
            const filters: string[] = [];

            if (searchName) filters.push(`name ~ '*${searchName}*'`);
            if (searchApiPath) filters.push(`apiPath ~ '*${searchApiPath}*'`);

            const keyword = filters.length > 0 ? filters.join(" and ") : null;

            console.log("Fetching permissions with filter:", keyword);
            const res = (await findAllPermissions({ page, size, keyword })).data.data;
            console.log("Permissions response:", res);
            if (res) {
                setPermissions(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            }
        } catch (err) {
            const errorMsg = getErrorMessage(err, "Không thể lấy danh sách quyền hạn.");
            console.error("Error fetching permissions:", err);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchPermissions(currentPage, itemsPerPage, searchName, searchApiPath);
    }, [currentPage, itemsPerPage, searchName, searchApiPath]);

    // Handle dialog state changes
    const handleDialogOpenChange = (open: boolean) => {
        setisDialogOpen(open);
        if (!open) {
            setSelectedPermission(null);
        }
    };

    // ============================
    // HANDLE RESET
    // ============================
    const handleReset = () => {
        setSearchName("");
        setsearchApiPath("");
        setCurrentPage(1);
    };

    // ============================
    // HANDLE CREATE OR UPDATE
    // ============================
    const handleSubmitUpsert = async (
        data: PermissionRequest,
        id?: number,
    ) => {
        try {
            setIsLoading(true);

            if (id) {
                await updatePermissionById(id, data);
                await fetchPermissions(1, itemsPerPage, searchName, searchApiPath);
                toast.success("Cập nhật quyền hạn mới thành công");
            } else {
                await savePermission(data);
                await fetchPermissions(1, itemsPerPage, searchName, searchApiPath);
                toast.success("Tạo quyền hạn mới thành công");
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

            await deletePermissionById(id);
            await fetchPermissions(1, itemsPerPage, searchName, searchApiPath);

            toast.success("Xóa quyền hạn thành công");
        } catch (err) {
            toast.error(getErrorMessage(err, "Thao tác thất bại"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PermissionSearchSection
                searchName={searchName}
                setSearchName={setSearchName}
                searchApiPath={searchApiPath}
                setsearchApiPath={setsearchApiPath}
                onReset={handleReset}
            />

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Danh sách Quyền hạn</h2>
                <HasPermission perm={"POST /api/permissions"}>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleOpenCreateForm}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm quyền hạn
                    </Button>
                </HasPermission>
            </div>

            <PermissionTable
                permissions={permissions}
                isLoading={isLoading}
                onDelete={handleDelete}
                onEdit={handleOpenEditForm}
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

            <PermissionForm
                open={isDialogOpen}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedPermission}
                onSubmit={handleSubmitUpsert}
                onCloseForm={() => setSelectedPermission(null)}
            />
        </div>
    );
};

export default PermissionManagerPage;
