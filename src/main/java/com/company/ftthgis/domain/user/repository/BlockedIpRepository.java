package com.company.ftthgis.domain.user.repository;

import com.company.ftthgis.domain.user.entity.BlockedIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BlockedIpRepository extends JpaRepository<BlockedIp, Long> {
    
    @Query("SELECT b FROM BlockedIp b WHERE b.ipAddressOrCidr = :ipAddressOrCidr")
    Optional<BlockedIp> findByIpAddressOrCidr(@Param("ipAddressOrCidr") String ipAddressOrCidr);
}
