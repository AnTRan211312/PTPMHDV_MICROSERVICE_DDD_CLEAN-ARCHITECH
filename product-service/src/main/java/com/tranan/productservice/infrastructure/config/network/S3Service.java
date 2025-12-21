package com.tranan.productservice.infrastructure.config.network;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    // Inject trực tiếp từ properties thay vì qua Bean String (linh hoạt hơn)
    @Value("${aws.s3.bucket-name}")
    private String awsBucketName;

    @Value("${aws.region}")
    private String awsRegion;

    /**
     * Upload file với tên file tùy chỉnh
     */
    public String uploadFile(MultipartFile file, String folder, String fileName, boolean getUrl) {
        String key = String.format("%s/%s", folder, fileName);
        return uploadToS3(file, key, getUrl);
    }

    /**
     * Upload file với key có sẵn (Overload)
     */
    public String uploadFile(MultipartFile file, String key, boolean getUrl) {
        return uploadToS3(file, key, getUrl);
    }

    // --- Private Helper để tránh lặp code ---
    private String uploadToS3(MultipartFile file, String key, boolean getUrl) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File cannot be null or empty");
            }

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(awsBucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            // Thực hiện upload
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            if (getUrl) {
                return String.format("https://%s.s3.%s.amazonaws.com/%s", awsBucketName, awsRegion, key);
            } else {
                return key;
            }
        } catch (IOException e) {
            log.error("IO Exception when reading file", e);
            throw new RuntimeException("Error reading file content", e);
        } catch (Exception e) {
            log.error("S3 Upload Error", e);
            throw new RuntimeException("Error uploading file to S3", e);
        }
    }
    public List<String> uploadMultiFile(
            List<MultipartFile> files,
            String folder,
            boolean getUrl
    ) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("File list cannot be empty");
        }

        if (files.size() > 5) {
            throw new IllegalArgumentException("Maximum 5 images allowed");
        }

        List<String> uploadedKeys = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
                String key = folder + "/" + fileName;

                uploadToS3(file, key, false); // luôn trả key trước
                uploadedKeys.add(key);
            }

            if (getUrl) {
                return uploadedKeys.stream()
                        .map(key -> String.format(
                                "https://%s.s3.%s.amazonaws.com/%s",
                                awsBucketName, awsRegion, key))
                        .toList();
            }

            return uploadedKeys;

        } catch (Exception e) {
            // rollback S3
            uploadedKeys.forEach(this::deleteFileByKey);
            throw new RuntimeException("Upload multiple images failed", e);
        }
    }

    public void deleteFileByUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            String objectKey = extractObjectKeyFromUrl(fileUrl);
            deleteFileByKey(objectKey);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid S3 URL provided for deletion: {}", fileUrl);
        }
    }

    public void deleteFileByKey(String key) {
        if (key == null || key.isBlank()) return;
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(awsBucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
        } catch (Exception e) {
            log.error("Error deleting file with key: {}", key, e);
            // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng chính (ví dụ xóa User)
        }
    }

    private String extractObjectKeyFromUrl(String url) {
        String base = String.format("https://%s.s3.%s.amazonaws.com/", awsBucketName, awsRegion);
        if (!url.startsWith(base)) {
            // Thử format khác (ví dụ s3-region) hoặc ném lỗi
            throw new IllegalArgumentException("URL does not match S3 bucket pattern");
        }
        return url.substring(base.length());
    }
}