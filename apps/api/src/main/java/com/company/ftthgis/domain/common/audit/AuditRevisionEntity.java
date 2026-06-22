package com.company.ftthgis.domain.common.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;
import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.Serializable;

@Entity
@Table(name = "revinfo")
@RevisionEntity(AuditRevisionEntity.AuditRevisionListener.class)
@Getter
@Setter
public class AuditRevisionEntity implements Serializable {

    @Id
    @GeneratedValue
    @RevisionNumber
    private int id;

    @RevisionTimestamp
    private long timestamp;

    private String username;

    public static class AuditRevisionListener implements RevisionListener {
        @Override
        public void newRevision(Object revisionEntity) {
            AuditRevisionEntity auditEntity = (AuditRevisionEntity) revisionEntity;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                auditEntity.setUsername(auth.getName());
            } else {
                auditEntity.setUsername("SYSTEM");
            }
        }
    }
}
