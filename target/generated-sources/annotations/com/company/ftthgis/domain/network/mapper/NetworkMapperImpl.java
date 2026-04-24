package com.company.ftthgis.domain.network.mapper;

import com.company.ftthgis.domain.network.dto.AssetDto;
import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.dto.OLTDto;
import com.company.ftthgis.domain.network.entity.Asset;
import com.company.ftthgis.domain.network.entity.AssetCategory;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-24T09:35:27+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class NetworkMapperImpl implements NetworkMapper {

    @Override
    public ODCDto toODCDto(ODC odc) {
        if ( odc == null ) {
            return null;
        }

        ODCDto oDCDto = new ODCDto();

        oDCDto.setOltId( odcOltId( odc ) );
        oDCDto.setOltName( odcOltName( odc ) );
        oDCDto.setOltCode( odcOltCode( odc ) );
        oDCDto.setCapacity( odc.getCapacity() );
        oDCDto.setCode( odc.getCode() );
        oDCDto.setGeom( odc.getGeom() );
        oDCDto.setId( odc.getId() );
        oDCDto.setLastNote( odc.getLastNote() );
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

        oDPDto.setOdcId( odpOdcId( odp ) );
        oDPDto.setOdcName( odpOdcName( odp ) );
        oDPDto.setOdcCode( odpOdcCode( odp ) );
        oDPDto.setCode( odp.getCode() );
        oDPDto.setGeom( odp.getGeom() );
        oDPDto.setId( odp.getId() );
        oDPDto.setLastNote( odp.getLastNote() );
        oDPDto.setOsmid( odp.getOsmid() );
        oDPDto.setStatus( odp.getStatus() );
        oDPDto.setTotalPort( odp.getTotalPort() );
        oDPDto.setUsedPort( odp.getUsedPort() );

        oDPDto.setNodeType( "ODP" );

        return oDPDto;
    }

    @Override
    public OLTDto toOLTDto(OLT olt) {
        if ( olt == null ) {
            return null;
        }

        OLTDto oLTDto = new OLTDto();

        oLTDto.setCode( olt.getCode() );
        oLTDto.setGeom( olt.getGeom() );
        oLTDto.setId( olt.getId() );
        oLTDto.setIpAddress( olt.getIpAddress() );
        oLTDto.setLastNote( olt.getLastNote() );
        oLTDto.setName( olt.getName() );
        oLTDto.setSnmpCommunity( olt.getSnmpCommunity() );
        oLTDto.setStatus( olt.getStatus() );

        oLTDto.setNodeType( "OLT" );
        oLTDto.setLng( olt.getGeom() != null ? olt.getGeom().getX() : null );
        oLTDto.setLat( olt.getGeom() != null ? olt.getGeom().getY() : null );

        return oLTDto;
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
        fiberCableDto.setLastNote( cable.getLastNote() );
        fiberCableDto.setLengthMeters( cable.getLengthMeters() );
        fiberCableDto.setStatus( cable.getStatus() );

        return fiberCableDto;
    }

    @Override
    public FiberCable toEntity(FiberCableDto dto) {
        if ( dto == null ) {
            return null;
        }

        FiberCable fiberCable = new FiberCable();

        fiberCable.setGeometry( dto.getGeom() );
        fiberCable.setCode( dto.getCode() );
        fiberCable.setFiberCount( dto.getFiberCount() );
        fiberCable.setId( dto.getId() );
        fiberCable.setLastNote( dto.getLastNote() );
        fiberCable.setLengthMeters( dto.getLengthMeters() );
        fiberCable.setStatus( dto.getStatus() );

        return fiberCable;
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

    private Long odcOltId(ODC oDC) {
        if ( oDC == null ) {
            return null;
        }
        OLT olt = oDC.getOlt();
        if ( olt == null ) {
            return null;
        }
        Long id = olt.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String odcOltName(ODC oDC) {
        if ( oDC == null ) {
            return null;
        }
        OLT olt = oDC.getOlt();
        if ( olt == null ) {
            return null;
        }
        String name = olt.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String odcOltCode(ODC oDC) {
        if ( oDC == null ) {
            return null;
        }
        OLT olt = oDC.getOlt();
        if ( olt == null ) {
            return null;
        }
        String code = olt.getCode();
        if ( code == null ) {
            return null;
        }
        return code;
    }

    private Long odpOdcId(ODP oDP) {
        if ( oDP == null ) {
            return null;
        }
        ODC odc = oDP.getOdc();
        if ( odc == null ) {
            return null;
        }
        Long id = odc.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String odpOdcName(ODP oDP) {
        if ( oDP == null ) {
            return null;
        }
        ODC odc = oDP.getOdc();
        if ( odc == null ) {
            return null;
        }
        String name = odc.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String odpOdcCode(ODP oDP) {
        if ( oDP == null ) {
            return null;
        }
        ODC odc = oDP.getOdc();
        if ( odc == null ) {
            return null;
        }
        String code = odc.getCode();
        if ( code == null ) {
            return null;
        }
        return code;
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
