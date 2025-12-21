import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,
    PaginationParams,
} from "@/types/apiResponse.d.ts";
import type {
    PermissionRequest,
    PermissionResponse,
} from "@/types/permision.d.ts";

export const savePermission = (data: PermissionRequest) => {
    return axiosClient.post<ApiResponse<PermissionRequest>>(
        "/permissions",
        data,
    );
};

export const findAllPermissions = ({
    page = 1,
    size = 5,
    keyword,
}: PaginationParams) => {
    const params = new URLSearchParams({
        page: (page > 0 ? page - 1 : 0).toString(),
        size: size.toString(),
    });

    if (keyword) params.append("keyword", keyword);

    return axiosClient.get<
        ApiResponse<PageResponseDto<PermissionResponse>>
    >(`/permissions?${params.toString()}`);
};

export const findAllPermissionsNoPaging = () => {
    return axiosClient.get<ApiResponse<PermissionResponse[]>>(
        "/permissions/all",
    );
};

export const updatePermissionById = (
    id: number,
    data: PermissionRequest,
) => {
    return axiosClient.put<ApiResponse<PermissionRequest>>(
        `/permissions/${id}`,
        data,
    );
};

export const deletePermissionById = (id: number) => {
    return axiosClient.delete<ApiResponse<PermissionRequest>>(
        `/permissions/${id}`,
    );
};
