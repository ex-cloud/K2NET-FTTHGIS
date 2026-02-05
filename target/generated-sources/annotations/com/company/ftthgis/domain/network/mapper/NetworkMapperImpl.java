package com.company.ftthgis.domain.network.mapper;

import com.company.ftthgis.domain.network.dto.AssetDto;
import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.Asset;
import com.company.ftthgis.domain.network.entity.AssetCategory;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-05T07:38:31+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.45.0.v20260128-0750, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class NetworkMapperImpl implements NetworkMapper {

    @Override
    public ODCDto toODCDto(ODC odc) {
        if ( odc == null ) {
            return null;
        }

        ODCDto oDCDto = new ODCDto();

        oDCDto.setCapacity( odc.getCapacity() );
        oDCDto.setCode( odc.getCode() );
        oDCDto.setGeom( odc.getGeom() );
        oDCDto.setId( odc.getId() );
        oDCDto.setName( odc.getName() );
        oDCDto.setStatus( odc.getStatus() );
        oDCDto.setUsedCapacity( odc.getUsedCapacity() );

        oDCDto.setNodeType( "ODC" );

        return oDCDto;
    }

    @Override
    public ODPDto toODPDto(ODP odp) {
        if ( odp == null ) {
            return null;
        }

        ODPDto oDPDto = new ODPDto();

        oDPDto.setCode( odp.getCode() );
        oDPDto.setGeom( odp.getGeom() );
        oDPDto.setId( odp.getId() );
        oDPDto.setOsmid( odp.getOsmid() );
        oDPDto.setStatus( odp.getStatus() );
        oDPDto.setTotalPort( odp.getTotalPort() );
        oDPDto.setUsedPort( odp.getUsedPort() );

        oDPDto.setNodeType( "ODP" );

        return oDPDto;
    }

    @Override
    public FiberCableDto toFiberCableDto(FiberCable cable) {
        if ( cable == null ) {
            return null;
        }

        FiberCableDto fiberCableDto = new FiberCableDto();

        fiberCableDto.setGeom( cable.getGeometry() );
        fiberCableDto.setCode( cable.getCode() );
        fiberCableDto.setFiberCount( cable.getFiberCount() );
        fiberCableDto.setId( cable.getId() );
        fiberCableDto.setLengthMeters( cable.getLengthMeters() );
        fiberCableDto.setStatus( cable.getStatus() );

        return fiberCableDto;
    }

    @Override
    public AssetDto toAssetDto(Asset asset) {
        if ( asset == null ) {
            return null;
        }

        AssetDto assetDto = new AssetDto();

        assetDto.setCategoryName( assetCategoryName( asset ) );
        assetDto.setId( asset.getId() );
        assetDto.setName( asset.getName() );
        assetDto.setPrice( asset.getPrice() );
        assetDto.setPurchaseDate( asset.getPurchaseDate() );
        assetDto.setSerialNumber( asset.getSerialNumber() );
        assetDto.setStatus( asset.getStatus() );

        return assetDto;
    }

    private String assetCategoryName(Asset asset) {
        if ( asset == null ) {
            return null;
        }
        AssetCategory category = asset.getCategory();
        if ( category == null ) {
            return null;
        }
        String name = category.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
