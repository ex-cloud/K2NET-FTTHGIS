package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    Optional<UserDevice> findByUserIdAndDeviceFingerprint(UUID userId, String deviceFingerprint);
    List<UserDevice> findAllByUserId(UUID userId);
}
