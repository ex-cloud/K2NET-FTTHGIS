package com.company.ftthgis.domain.task.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank(message = "Komentar tidak boleh kosong")
        String content
) {}
