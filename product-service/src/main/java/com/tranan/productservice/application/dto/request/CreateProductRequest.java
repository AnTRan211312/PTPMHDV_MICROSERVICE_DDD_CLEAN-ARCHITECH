package com.tranan.productservice.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm là bắt buộc")
    @Size(min = 2, max = 255, message = "Tên sản phẩm từ 2 đến 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Giá sản phẩm là bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá sản phẩm phải lớn hơn 0")
    private BigDecimal price;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá khuyến mãi phải lớn hơn 0")
    private BigDecimal discountPrice;

    @NotEmpty(message = "Sản phẩm phải thuộc ít nhất 1 danh mục")
    private Set<Long> categoryIds;

}