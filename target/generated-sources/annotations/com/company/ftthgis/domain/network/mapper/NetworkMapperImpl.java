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
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-06T12:27:45+0700",
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

        oDCDto.setOltId( odcOltId( odc ) );
        oDCDto.setOltName( odcOltName( odc ) );
        oDCDto.setOltCode( odcOltCode( odc ) );
        oDCDto.setId( odc.getId() );
        oDCDto.setCode( odc.getCode() );
        oDCDto.setName( odc.getName() );
        oDCDto.setGeom( odc.getGeom() );
        oDCDto.setCapacity( odc.getCapacity() );
        oDCDto.setUsedCapacity( odc.getUsedCapacity() );
        oDCDto.setStatus( odc.getStatus() );
        oDCDto.setHealthStatus( odc.getHealthStatus() );
        oDCDto.setLastNote( odc.getLastNote() );
        oDCDto.setAddress( odc.getAddress() );

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
        oDPDto.setId( odp.getId() );
        oDPDto.setOsmid( odp.getOsmid() );
        oDPDto.setCode( odp.getCode() );
        oDPDto.setGeom( odp.getGeom() );
        oDPDto.setTotalPort( odp.getTotalPort() );
        oDPDto.setUsedPort( odp.getUsedPort() );
        oDPDto.setStatus( odp.getStatus() );
        oDPDto.setHealthStatus( odp.getHealthStatus() );
        oDPDto.setLastNote( odp.getLastNote() );
        oDPDto.setAddress( odp.getAddress() );

        oDPDto.setNodeType( "ODP" );

        return oDPDto;
    }

    @Override
    public OLTDto toOLTDto(OLT olt) {
        if ( olt == null ) {
            return null;
        }

        OLTDto oLTDto = new OLTDto();

        oLTDto.setId( olt.getId() );
        oLTDto.setCode( olt.getCode() );
        oLTDto.setName( olt.getName() );
        oLTDto.setIpAddress( olt.getIpAddress() );
        oLTDto.setSnmpCommunity( olt.getSnmpCommunity() );
        oLTDto.setStatus( olt.getStatus() );
        oLTDto.setHealthStatus( olt.getHealthStatus() );
        oLTDto.setGeom( olt.getGeom() );
        oLTDto.setLastNote( olt.getLastNote() );
        oLTDto.setAddress( olt.getAddress() );

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
        fiberCableDto.setId( cable.getId() );
        fiberCableDto.setCode( cable.getCode() );
        fiberCableDto.setFiberCount( cable.getFiberCount() );
        fiberCableDto.setStatus( cable.getStatus() );
        fiberCableDto.setLengthMeters( cable.getLengthMeters() );
        fiberCableDto.setLastNote( cable.getLastNote() );

        return fiberCableDto;
    }

    @Override
    public FiberCable toEntity(FiberCableDto dto) {
        if ( dto == null ) {
            return null;
        }

        FiberCable.FiberCableBuilder<?, ?> fiberCable = FiberCable.builder();

        fiberCable.geometry( dto.getGeom() );
        fiberCable.id( dto.getId() );
        fiberCable.code( dto.getCode() );
        fiberCable.fiberCount( dto.getFiberCount() );
        fiberCable.status( dto.getStatus() );
        fiberCable.lengthMeters( dto.getLengthMeters() );
        fiberCable.lastNote( dto.getLastNote() );

        return fiberCable.build();
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

    private UUID odcOltId(ODC oDC) {
        if ( oDC == null ) {
            return null;
        }
        OLT olt = oDC.getOlt();
        if ( olt == null ) {
            return null;
        }
        UUID id = olt.getId();
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

    private UUID odpOdcId(ODP oDP) {
        if ( oDP == null ) {
            return null;
        }
        ODC odc = oDP.getOdc();
        if ( odc == null ) {
            return null;
        }
        UUID id = odc.getId();
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
