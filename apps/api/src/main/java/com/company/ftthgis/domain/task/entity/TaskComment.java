package com.company.ftthgis.domain.task.entity;

import com.company.ftthgis.domain.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * A comment or activity note on a {@link Task}.
 *
 * <p>Not tenant-filtered independently — access is controlled via the parent Task's
 * organization_id. Comments are cascade-deleted when the parent task is deleted.
 */
@Entity
@Table(name = "task_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class TaskComment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    /** UUID of the Keycloak user who wrote this comment. */
    @Column(name = "author_id", nullable = false, length = 255)
    private String authorId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
}
