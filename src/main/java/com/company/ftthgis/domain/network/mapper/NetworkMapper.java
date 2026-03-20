package com.company.ftthgis.domain.network.mapper;

import com.company.ftthgis.domain.network.dto.AssetDto;
import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.dto.OLTDto;
import com.company.ftthgis.domain.network.entity.Asset;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NetworkMapper {

    @Mapping(target = "nodeType", constant = "ODC")
    @Mapping(target = "oltId", source = "olt.id")
    @Mapping(target = "oltName", source = "olt.name")
    @Mapping(target = "oltCode", source = "olt.code")
    ODCDto toODCDto(ODC odc);

    @Mapping(target = "nodeType", constant = "ODP")
    @Mapping(target = "odcId", source = "odc.id")
    @Mapping(target = "odcName", source = "odc.name")
    @Mapping(target = "odcCode", source = "odc.code")
    ODPDto toODPDto(ODP odp);

    @Mapping(target = "nodeType", constant = "OLT")
    OLTDto toOLTDto(OLT olt);

    @Mapping(target = "geom", source = "geometry")
    FiberCableDto toFiberCableDto(FiberCable cable);

    @Mapping(target = "geometry", source = "geom")
    FiberCable toEntity(FiberCableDto dto);

    @Mapping(target = "categoryName", source = "category.name")
    AssetDto toAssetDto(Asset asset);
}
