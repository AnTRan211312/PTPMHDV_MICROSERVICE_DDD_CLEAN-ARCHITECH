import type {
    ApiResponse,
    PageResponseDto,
    PaginationParams,
} from "@/types/apiResponse.d.ts";
import axiosClient from "@/lib/axiosClient.ts";
import type {
    RoleRequest,
    RoleResponse,
} from "@/types/role.d.ts";

export const saveRole = (data: RoleRequest) => {
    return axiosClient.post<ApiResponse<RoleResponse>>("/roles", data);
};

export const findAllRoles = ({
    page = 0,
    size = 5,
    keyword,
}: PaginationParams) => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });

    if (keyword) params.append("keyword", keyword);

    return axiosClient.get<ApiResponse<PageResponseDto<RoleResponse>>>(
        `/roles?${params.toString()}`,
    );
};

export const updateRoleById = (id: number, data: RoleRequest) => {
    return axiosClient.put<ApiResponse<RoleResponse>>(
        `/roles/${id}`,
        data,
    );
};

export const deleteRoleById = (id: number) => {
    return axiosClient.delete(`/roles/${id}`);
};
