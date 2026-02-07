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
    date = "2026-02-07T14:15:26+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class NetworkMapperImpl implements NetworkMapper {

    @Override
    public ODCDto toODCDto(ODC odc) {
        if ( odc == null ) {
            return null;
        }

        ODCDto oDCDto = new ODCDto();

        oDCDto.setId( odc.getId() );
        oDCDto.setCode( odc.getCode() );
        oDCDto.setName( odc.getName() );
        oDCDto.setGeom( odc.getGeom() );
        oDCDto.setCapacity( odc.getCapacity() );
        oDCDto.setUsedCapacity( odc.getUsedCapacity() );
        oDCDto.setStatus( odc.getStatus() );

        oDCDto.setNodeType( "ODC" );

        return oDCDto;
    }

    @Override
    public ODPDto toODPDto(ODP odp) {
        if ( odp == null ) {
            return null;
        }

        ODPDto oDPDto = new ODPDto();

        oDPDto.setId( odp.getId() );
        oDPDto.setOsmid( odp.getOsmid() );
        oDPDto.setCode( odp.getCode() );
        oDPDto.setGeom( odp.getGeom() );
        oDPDto.setTotalPort( odp.getTotalPort() );
        oDPDto.setUsedPort( odp.getUsedPort() );
        oDPDto.setStatus( odp.getStatus() );

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
        fiberCableDto.setId( cable.getId() );
        fiberCableDto.setCode( cable.getCode() );
        fiberCableDto.setFiberCount( cable.getFiberCount() );
        fiberCableDto.setStatus( cable.getStatus() );
        fiberCableDto.setLengthMeters( cable.getLengthMeters() );

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
        assetDto.setSerialNumber( asset.getSerialNumber() );
        assetDto.setName( asset.getName() );
        assetDto.setStatus( asset.getStatus() );
        assetDto.setPrice( asset.getPrice() );
        assetDto.setPurchaseDate( asset.getPurchaseDate() );

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

