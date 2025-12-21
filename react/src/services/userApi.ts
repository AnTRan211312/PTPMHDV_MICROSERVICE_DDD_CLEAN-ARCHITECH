import axiosClient from "@/lib/axiosClient";
import type {
    ApiResponse,
    PageResponseDto,
    PaginationParams,
} from "@/types/apiResponse";
import type {
    UserResponse,
    SelfUserUpdatePasswordRequest,
    SelfUserUpdateProfileRequest,
    UserCreateRequest,
    UserUpdateRequest,
} from "@/types/user";

export const getUserList = ({
    page = 1,
    size = 5,
    keyword,
}: PaginationParams) => {
    const params = new URLSearchParams({
        page: (page > 0 ? page - 1 : 0).toString(),
        size: size.toString(),
    });

    // Backend nhận param keyword để tìm kiếm theo tên hoặc email
    if (keyword) params.append("keyword", keyword);

    return axiosClient.get<ApiResponse<PageResponseDto<UserResponse>>>(
        `/users?${params.toString()}`,
    );
};

export const saveUser = (data: UserCreateRequest) => {
    return axiosClient.post<ApiResponse<UserResponse>>("/users", data);
};

export const updateUser = (data: UserUpdateRequest) => {
    return axiosClient.put<ApiResponse<UserResponse>>("/users", data);
};

export const getUserById = (id: number) => {
    return axiosClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
};

export const deleteUserById = (id: number) => {
    return axiosClient.delete<ApiResponse<UserResponse>>(
        `/users/${id}`,
    );
};

export const selfUserProfileUpdateApi = (
    data: SelfUserUpdateProfileRequest,
) => {
    return axiosClient.post("/users/me/update-profile", data);
};

export const selfUserPasswordUpdateApi = (
    data: SelfUserUpdatePasswordRequest,
) => {
    return axiosClient.post("/users/me/update-password", data);
};

export const selfUserAvatarUpdateApi = (data: FormData) => {
    return axiosClient.post("/users/me/upload-avatar", data);
};
