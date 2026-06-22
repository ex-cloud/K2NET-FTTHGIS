--
-- PostgreSQL database dump
--

-- \restrict NLJXnSe0BK7pIUIo5yPTtdnfvhTgp7YtVmTg4rX4KiJP4NyuT4jYrXg9BJuFp10

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: pgrouting; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgrouting WITH SCHEMA public;


--
-- Name: EXTENSION pgrouting; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgrouting IS 'pgRouting Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: fn_truncate_cache(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_truncate_cache() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    TRUNCATE TABLE map_features_cache;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.fn_truncate_cache() OWNER TO postgres;

--
-- Name: get_mvt_data(integer, integer, integer, json); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_mvt_data(z integer, x integer, y integer, query json) RETURNS bytea
    LANGUAGE plpgsql STRICT PARALLEL SAFE
    AS $$
DECLARE
    mvt bytea;
    p_id uuid;
BEGIN
    p_id := NULLIF(query->>'project_id', '')::uuid;

    WITH bounds AS (
        SELECT ST_TileEnvelope(z, x, y) AS tile_geom,
               ST_Transform(ST_TileEnvelope(z, x, y), 4326) AS bbox_geom
    ),
    mvt_nodes AS (
        SELECT ST_AsMvtGeom(ST_Transform(raw_nodes.geom, 3857), bounds.tile_geom) AS geom,
               raw_nodes.id, raw_nodes.node_type, raw_nodes.status, raw_nodes.signal_db, raw_nodes.point_count, raw_nodes.code
        FROM (
            SELECT
                CASE WHEN z < 10 THEN c.geom ELSE n.geom END as geom,
                CASE WHEN z < 10 THEN c.id ELSE n.id END as id,
                CASE WHEN z < 10 THEN c.node_type ELSE n.node_type END as node_type,
                CASE WHEN z < 10 THEN c.aggregated_status ELSE n.status END as status,
                CASE WHEN z < 10 THEN c.avg_signal_db ELSE n.signal_db END as signal_db,
                CASE WHEN z < 10 THEN c.point_count ELSE 1 END as point_count,
                CASE WHEN z >= 10 THEN n.code ELSE NULL END as code
            FROM bounds
            LEFT JOIN mv_clustered_nodes c ON z < 10 AND c.geom && bounds.bbox_geom
            LEFT JOIN network_nodes n ON z >= 10 AND n.geom && bounds.bbox_geom
            WHERE (z < 10 AND c.id IS NOT NULL) OR (z >= 10 AND n.id IS NOT NULL)
              AND (p_id IS NULL OR (z < 10 AND c.project_id = p_id) OR (z >= 10 AND n.project_id = p_id))
        ) raw_nodes, bounds
    ),
    mvt_edges AS (
        SELECT ST_AsMvtGeom(ST_Transform(
            CASE WHEN z < 13 THEN e.geometry_simple ELSE e.geom END, 3857), bounds.tile_geom) AS geom,
               e.id, e.status, e.fiber_count, e.code
        FROM network_edges e, bounds
        WHERE e.geom && bounds.bbox_geom
          AND (p_id IS NULL OR e.project_id = p_id)
    )
    SELECT (SELECT ST_AsMvt(mvt_nodes.*, 'nodes') FROM mvt_nodes) ||
           (SELECT ST_AsMvt(mvt_edges.*, 'edges') FROM mvt_edges) INTO mvt;

    RETURN mvt;
END;
$$;


ALTER FUNCTION public.get_mvt_data(z integer, x integer, y integer, query json) OWNER TO postgres;

--
-- Name: FUNCTION get_mvt_data(z integer, x integer, y integer, query json); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_mvt_data(z integer, x integer, y integer, query json) IS '{
    "description": "Dynamic MVT for FTTH GIS",
    "vector_layers": [
        { "id": "nodes", "description": "Network Nodes" },
        { "id": "edges", "description": "Network Edges" }
    ]
}';


--
-- Name: sync_edge_to_cache(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_edge_to_cache() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM map_features_cache WHERE feature_id = OLD.id AND feature_type = 'EDGE';
    ELSE
        INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
        VALUES (NEW.id, NEW.code, 'EDGE', 'CABLE', NEW.status, 'UP', NEW.project_id, NEW.geom)
        ON CONFLICT (feature_id, feature_type) DO UPDATE SET
            code = EXCLUDED.code,
            status = EXCLUDED.status,
            project_id = EXCLUDED.project_id,
            geom = EXCLUDED.geom;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_edge_to_cache() OWNER TO postgres;

--
-- Name: sync_node_to_cache(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_node_to_cache() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM map_features_cache WHERE feature_id = OLD.id AND feature_type = 'NODE';
    ELSE
        INSERT INTO map_features_cache (feature_id, code, feature_type, node_type, status, health_status, project_id, geom)
        VALUES (NEW.id, NEW.code, 'NODE', NEW.node_type, NEW.status, NEW.health_status, NEW.project_id, NEW.geom)
        ON CONFLICT (feature_id, feature_type) DO UPDATE SET
            code = EXCLUDED.code,
            node_type = EXCLUDED.node_type,
            status = EXCLUDED.status,
            health_status = EXCLUDED.health_status,
            project_id = EXCLUDED.project_id,
            geom = EXCLUDED.geom;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_node_to_cache() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_categories (
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    id uuid NOT NULL,
    project_id uuid,
    created_by character varying(255),
    description character varying(255),
    icon character varying(255),
    name character varying(255) NOT NULL,
    slug character varying(255),
    updated_by character varying(255),
    organization_id uuid NOT NULL
);


ALTER TABLE public.asset_categories OWNER TO postgres;

--
-- Name: asset_categories_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_categories_aud (
    rev integer NOT NULL,
    revtype smallint,
    id uuid NOT NULL,
    description character varying(255),
    icon character varying(255),
    name character varying(255),
    slug character varying(255)
);


ALTER TABLE public.asset_categories_aud OWNER TO postgres;

--
-- Name: asset_deletion_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_deletion_log (
    deleted_at timestamp(6) without time zone NOT NULL,
    id bigint NOT NULL,
    reason character varying(500) NOT NULL,
    asset_code character varying(255) NOT NULL,
    asset_type character varying(255) NOT NULL,
    deleted_by character varying(255)
);


ALTER TABLE public.asset_deletion_log OWNER TO postgres;

--
-- Name: asset_deletion_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asset_deletion_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_deletion_log_id_seq OWNER TO postgres;

--
-- Name: asset_deletion_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asset_deletion_log_id_seq OWNED BY public.asset_deletion_log.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    price double precision,
    created_at timestamp(6) without time zone,
    purchase_date timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    category_id uuid NOT NULL,
    edge_id uuid,
    id uuid NOT NULL,
    node_id uuid,
    project_id uuid,
    created_by character varying(255),
    name character varying(255) NOT NULL,
    serial_number character varying(255),
    status character varying(255),
    updated_by character varying(255),
    organization_id uuid NOT NULL
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: assets_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets_aud (
    price double precision,
    rev integer NOT NULL,
    revtype smallint,
    purchase_date timestamp(6) without time zone,
    category_id uuid,
    edge_id uuid,
    id uuid NOT NULL,
    node_id uuid,
    name character varying(255),
    serial_number character varying(255),
    status character varying(255)
);


ALTER TABLE public.assets_aud OWNER TO postgres;

--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_ips (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    ip_address_or_cidr character varying(255) NOT NULL,
    reason character varying(255)
);


ALTER TABLE public.blocked_ips OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocked_ips_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocked_ips_id_seq OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocked_ips_id_seq OWNED BY public.blocked_ips.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    odp_id uuid,
    name character varying(255)
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers_aud (
    rev integer NOT NULL,
    id uuid NOT NULL,
    odp_id uuid,
    name character varying(255)
);


ALTER TABLE public.customers_aud OWNER TO postgres;

--
-- Name: dashboard_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_snapshots (
    network_uptime double precision NOT NULL,
    total_network_length_km double precision NOT NULL,
    active_nodes bigint NOT NULL,
    customer_reach bigint NOT NULL,
    down_nodes bigint NOT NULL,
    id bigint NOT NULL,
    recorded_at timestamp(6) without time zone NOT NULL,
    total_nodes bigint NOT NULL,
    project_id uuid NOT NULL
);


ALTER TABLE public.dashboard_snapshots OWNER TO postgres;

--
-- Name: dashboard_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dashboard_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dashboard_snapshots_id_seq OWNER TO postgres;

--
-- Name: dashboard_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dashboard_snapshots_id_seq OWNED BY public.dashboard_snapshots.id;


--
-- Name: fiber_core; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiber_core (
    attenuation_db double precision,
    core_number integer NOT NULL,
    updated_at timestamp(6) without time zone,
    cable_id uuid NOT NULL,
    from_node_id uuid,
    id uuid NOT NULL,
    to_node_id uuid,
    color character varying(20),
    status character varying(255) NOT NULL
);


ALTER TABLE public.fiber_core OWNER TO postgres;

--
-- Name: fiber_splice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiber_splice (
    loss_db double precision,
    created_at timestamp(6) without time zone,
    from_core_id uuid NOT NULL,
    from_port_id uuid,
    id uuid NOT NULL,
    to_core_id uuid NOT NULL,
    to_port_id uuid,
    notes character varying(500),
    splice_type character varying(255),
    location public.geometry(Point,4326)
);


ALTER TABLE public.fiber_splice OWNER TO postgres;

--
-- Name: map_features_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.map_features_cache (
    feature_id bigint NOT NULL,
    code character varying(255),
    feature_type character varying(50) NOT NULL,
    node_type character varying(50),
    status character varying(50),
    health_status character varying(50),
    project_id character varying(255),
    geom public.geometry,
    node_id uuid,
    edge_id uuid
);


ALTER TABLE public.map_features_cache OWNER TO postgres;

--
-- Name: material_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_prices (
    id uuid NOT NULL,
    category character varying(255) NOT NULL,
    description character varying(255),
    material_name character varying(255) NOT NULL,
    price double precision NOT NULL,
    unit character varying(255) NOT NULL
);


ALTER TABLE public.material_prices OWNER TO postgres;

--
-- Name: network_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_nodes (
    elevation double precision,
    signal_db double precision,
    created_at timestamp(6) without time zone,
    last_maintenance timestamp(6) without time zone,
    osmid bigint,
    updated_at timestamp(6) without time zone,
    id uuid NOT NULL,
    project_id uuid,
    node_type character varying(31) NOT NULL,
    address character varying(255),
    code character varying(255) NOT NULL,
    created_by character varying(255),
    health_status character varying(255),
    last_note character varying(255),
    status character varying(255),
    updated_by character varying(255),
    geom public.geometry(Point,4326) NOT NULL,
    organization_id uuid NOT NULL
);


ALTER TABLE public.network_nodes OWNER TO postgres;

--
-- Name: mv_clustered_nodes; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_clustered_nodes AS
 SELECT gen_random_uuid() AS id,
    project_id,
    'CLUSTER'::text AS node_type,
    public.st_centroid(public.st_collect(geom)) AS geom,
    count(*) AS point_count,
    'ACTIVE'::text AS aggregated_status,
    avg(signal_db) AS avg_signal_db
   FROM public.network_nodes
  GROUP BY project_id, (public.st_snaptogrid(geom, (0.005)::double precision))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_clustered_nodes OWNER TO postgres;

--
-- Name: network_edges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_edges (
    cost double precision,
    fiber_count integer,
    length_meters double precision,
    oneway boolean,
    reverse_cost double precision,
    source integer,
    speed_limit integer,
    target integer,
    created_at timestamp(6) without time zone,
    last_maintenance timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    id uuid NOT NULL,
    project_id uuid,
    code character varying(255) NOT NULL,
    created_by character varying(255),
    last_note character varying(255),
    road_type character varying(255),
    status character varying(255),
    updated_by character varying(255),
    geom public.geometry(LineString,4326) NOT NULL,
    geometry_simple public.geometry(LineString,4326),
    organization_id uuid NOT NULL
);


ALTER TABLE public.network_edges OWNER TO postgres;

--
-- Name: network_edges_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_edges_aud (
    cost double precision,
    fiber_count integer,
    length_meters double precision,
    oneway boolean,
    rev integer NOT NULL,
    reverse_cost double precision,
    revtype smallint,
    source integer,
    speed_limit integer,
    target integer,
    last_maintenance timestamp(6) without time zone,
    id uuid NOT NULL,
    code character varying(255),
    last_note character varying(255),
    road_type character varying(255),
    status character varying(255),
    geom public.geometry(LineString,4326),
    geometry_simple public.geometry(LineString,4326)
);


ALTER TABLE public.network_edges_aud OWNER TO postgres;

--
-- Name: network_edges_vertices_pgr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_edges_vertices_pgr (
    id integer NOT NULL,
    the_geom public.geometry(Point,4326)
);


ALTER TABLE public.network_edges_vertices_pgr OWNER TO postgres;

--
-- Name: network_edges_vertices_pgr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_edges_vertices_pgr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.network_edges_vertices_pgr_id_seq OWNER TO postgres;

--
-- Name: network_edges_vertices_pgr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_edges_vertices_pgr_id_seq OWNED BY public.network_edges_vertices_pgr.id;


--
-- Name: network_event_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_event_history (
    "timestamp" timestamp(6) without time zone CONSTRAINT network_event_history_timestamp_not_null1 NOT NULL,
    id uuid CONSTRAINT network_event_history_id_not_null1 NOT NULL,
    project_id uuid CONSTRAINT network_event_history_project_id_not_null1 NOT NULL,
    asset_code character varying(255) CONSTRAINT network_event_history_asset_code_not_null1 NOT NULL,
    asset_type character varying(255) CONSTRAINT network_event_history_asset_type_not_null1 NOT NULL,
    event_type character varying(255) CONSTRAINT network_event_history_event_type_not_null1 NOT NULL,
    new_status character varying(255) CONSTRAINT network_event_history_new_status_not_null1 NOT NULL,
    old_status character varying(255) CONSTRAINT network_event_history_old_status_not_null1 NOT NULL,
    reason character varying(255)
);


ALTER TABLE public.network_event_history OWNER TO postgres;

--
-- Name: network_event_history_old; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_event_history_old (
    id bigint CONSTRAINT network_event_history_id_not_null NOT NULL,
    "timestamp" timestamp(6) without time zone CONSTRAINT network_event_history_timestamp_not_null NOT NULL,
    asset_code character varying(255) CONSTRAINT network_event_history_asset_code_not_null NOT NULL,
    asset_type character varying(255) CONSTRAINT network_event_history_asset_type_not_null NOT NULL,
    event_type character varying(255) CONSTRAINT network_event_history_event_type_not_null NOT NULL,
    new_status character varying(255) CONSTRAINT network_event_history_new_status_not_null NOT NULL,
    old_status character varying(255) CONSTRAINT network_event_history_old_status_not_null NOT NULL,
    project_id character varying(255) CONSTRAINT network_event_history_project_id_not_null NOT NULL,
    reason character varying(255)
);


ALTER TABLE public.network_event_history_old OWNER TO postgres;

--
-- Name: network_event_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_event_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.network_event_history_id_seq OWNER TO postgres;

--
-- Name: network_event_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_event_history_id_seq OWNED BY public.network_event_history_old.id;


--
-- Name: network_nodes_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_nodes_aud (
    elevation double precision,
    rev integer NOT NULL,
    revtype smallint,
    signal_db double precision,
    last_maintenance timestamp(6) without time zone,
    osmid bigint,
    id uuid NOT NULL,
    node_type character varying(31) NOT NULL,
    address character varying(255),
    code character varying(255),
    health_status character varying(255),
    last_note character varying(255),
    status character varying(255),
    geom public.geometry(Point,4326)
);


ALTER TABLE public.network_nodes_aud OWNER TO postgres;

--
-- Name: odc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.odc (
    capacity integer,
    used_capacity integer,
    id uuid NOT NULL,
    olt_id uuid,
    name character varying(255)
);


ALTER TABLE public.odc OWNER TO postgres;

--
-- Name: odc_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.odc_aud (
    capacity integer,
    rev integer NOT NULL,
    used_capacity integer,
    id uuid NOT NULL,
    olt_id uuid,
    name character varying(255)
);


ALTER TABLE public.odc_aud OWNER TO postgres;

--
-- Name: odp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.odp (
    total_port integer,
    used_port integer,
    id uuid NOT NULL,
    odc_id uuid
);


ALTER TABLE public.odp OWNER TO postgres;

--
-- Name: odp_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.odp_aud (
    rev integer NOT NULL,
    total_port integer,
    used_port integer,
    id uuid NOT NULL,
    odc_id uuid
);


ALTER TABLE public.odp_aud OWNER TO postgres;

--
-- Name: olt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.olt (
    id uuid NOT NULL,
    ip_address character varying(255),
    name character varying(255),
    snmp_community character varying(255)
);


ALTER TABLE public.olt OWNER TO postgres;

--
-- Name: olt_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.olt_aud (
    rev integer NOT NULL,
    id uuid NOT NULL,
    ip_address character varying(255),
    name character varying(255),
    snmp_community character varying(255)
);


ALTER TABLE public.olt_aud OWNER TO postgres;

--
-- Name: organization_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_configs (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    config_key character varying(255) NOT NULL,
    config_value text,
    description character varying(255),
    is_active boolean,
    organization_id uuid NOT NULL
);


ALTER TABLE public.organization_configs OWNER TO postgres;

--
-- Name: organization_configs_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_configs_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    config_key character varying(255),
    config_value text,
    description character varying(255),
    is_active boolean
);


ALTER TABLE public.organization_configs_aud OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    address character varying(255),
    description text,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    website character varying(255),
    logo_url character varying(255),
    plan_id uuid,
    trial_expires_at timestamp(6) without time zone,
    status character varying(255) DEFAULT 'ACTIVE'::character varying
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: organizations_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    address character varying(255),
    description text,
    logo_url character varying(255),
    name character varying(255),
    slug character varying(255),
    status character varying(255),
    trial_expires_at timestamp(6) without time zone,
    website character varying(255),
    plan_id uuid,
    CONSTRAINT organizations_aud_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SUSPENDED'::character varying, 'TRIAL_EXPIRED'::character varying, 'DELETED'::character varying])::text[])))
);


ALTER TABLE public.organizations_aud OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    project_id uuid,
    code character varying(255) NOT NULL,
    created_by character varying(255),
    description character varying(255),
    module character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    updated_by character varying(255)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions_aud (
    rev integer NOT NULL,
    revtype smallint,
    id bigint NOT NULL,
    code character varying(255),
    description character varying(255),
    module character varying(255),
    name character varying(255)
);


ALTER TABLE public.permissions_aud OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_members (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    project_id uuid,
    role_id bigint NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL
);


ALTER TABLE public.project_members OWNER TO postgres;

--
-- Name: project_members_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_members_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    project_id uuid,
    role_id bigint,
    user_id uuid
);


ALTER TABLE public.project_members_aud OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    organization_id uuid CONSTRAINT projects_org_id_not_null NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    region character varying(255),
    code character varying(255),
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255)
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    code character varying(255),
    description text,
    name character varying(255),
    region character varying(255)
);


ALTER TABLE public.projects_aud OWNER TO postgres;

--
-- Name: revinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revinfo (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    username character varying(255)
);


ALTER TABLE public.revinfo OWNER TO postgres;

--
-- Name: revinfo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.revinfo_seq
    START WITH 1
    INCREMENT BY 50
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revinfo_seq OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions_aud (
    rev integer NOT NULL,
    revtype smallint,
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_permissions_aud OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    created_at timestamp(6) without time zone,
    id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    project_id uuid,
    created_by character varying(255),
    description character varying(255),
    display_name character varying(255),
    name character varying(255) NOT NULL,
    updated_by character varying(255),
    is_system_role boolean DEFAULT false NOT NULL,
    organization_id uuid
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_aud (
    rev integer NOT NULL,
    revtype smallint,
    id bigint NOT NULL,
    description character varying(255),
    display_name character varying(255),
    name character varying(255),
    is_system_role boolean,
    organization_id uuid
);


ALTER TABLE public.roles_aud OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_events (
    id bigint NOT NULL,
    browser character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    details character varying(2000),
    event_type character varying(255) NOT NULL,
    ip_address character varying(255) NOT NULL,
    location character varying(255),
    os character varying(255),
    severity character varying(255) NOT NULL,
    user_id uuid,
    username character varying(255) NOT NULL
);


ALTER TABLE public.security_events OWNER TO postgres;

--
-- Name: security_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_events_id_seq OWNER TO postgres;

--
-- Name: security_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_events_id_seq OWNED BY public.security_events.id;


--
-- Name: splitter_port; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.splitter_port (
    port_number integer NOT NULL,
    direction character varying(5) NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    node_type character varying(10) NOT NULL,
    connected_core_id uuid,
    id uuid NOT NULL,
    node_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    label character varying(255)
);


ALTER TABLE public.splitter_port OWNER TO postgres;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id uuid NOT NULL,
    description text,
    has_api_access boolean,
    has_sso boolean,
    max_customers integer,
    max_odcs integer,
    max_odps integer,
    max_projects integer,
    name character varying(255) NOT NULL,
    price numeric(38,2) NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: subscription_plans_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans_aud (
    id uuid NOT NULL,
    rev integer NOT NULL,
    revtype smallint,
    description text,
    has_api_access boolean,
    has_sso boolean,
    max_customers integer,
    max_odcs integer,
    max_odps integer,
    max_projects integer,
    name character varying(255),
    price numeric(38,2)
);


ALTER TABLE public.subscription_plans_aud OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    config_key character varying(255) NOT NULL,
    category character varying(255) NOT NULL,
    description text,
    config_value text,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255)
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: user_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_audit_logs (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    updated_at timestamp(6) without time zone,
    updated_by character varying(255),
    action character varying(255) NOT NULL,
    new_value character varying(255),
    previous_value character varying(255),
    reason character varying(2000) NOT NULL,
    target_user_email character varying(255) NOT NULL,
    target_user_id uuid NOT NULL,
    organization_id uuid
);


ALTER TABLE public.user_audit_logs OWNER TO postgres;

--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_devices (
    id bigint NOT NULL,
    browser character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    device_fingerprint character varying(255) NOT NULL,
    ip_address character varying(255) NOT NULL,
    last_used_at timestamp(6) without time zone NOT NULL,
    os character varying(255) NOT NULL,
    verified boolean NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.user_devices OWNER TO postgres;

--
-- Name: user_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_devices_id_seq OWNER TO postgres;

--
-- Name: user_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_devices_id_seq OWNED BY public.user_devices.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    created_at timestamp(6) without time zone,
    role_id bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    id uuid NOT NULL,
    project_id uuid,
    avatar_url character varying(1000),
    created_by character varying(255),
    email character varying(255) NOT NULL,
    full_name character varying(255),
    status character varying(255) NOT NULL,
    updated_by character varying(255),
    username character varying(255),
    organization_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_aud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_aud (
    rev integer NOT NULL,
    revtype smallint,
    role_id bigint,
    id uuid NOT NULL,
    avatar_url character varying(1000),
    email character varying(255),
    full_name character varying(255),
    status character varying(255),
    username character varying(255),
    org_id uuid
);


ALTER TABLE public.users_aud OWNER TO postgres;

--
-- Name: asset_deletion_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_log ALTER COLUMN id SET DEFAULT nextval('public.asset_deletion_log_id_seq'::regclass);


--
-- Name: blocked_ips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips ALTER COLUMN id SET DEFAULT nextval('public.blocked_ips_id_seq'::regclass);


--
-- Name: dashboard_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_snapshots ALTER COLUMN id SET DEFAULT nextval('public.dashboard_snapshots_id_seq'::regclass);


--
-- Name: network_edges_vertices_pgr id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges_vertices_pgr ALTER COLUMN id SET DEFAULT nextval('public.network_edges_vertices_pgr_id_seq'::regclass);


--
-- Name: network_event_history_old id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_event_history_old ALTER COLUMN id SET DEFAULT nextval('public.network_event_history_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: security_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_events ALTER COLUMN id SET DEFAULT nextval('public.security_events_id_seq'::regclass);


--
-- Name: user_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices ALTER COLUMN id SET DEFAULT nextval('public.user_devices_id_seq'::regclass);


--
-- Name: asset_categories_aud asset_categories_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories_aud
    ADD CONSTRAINT asset_categories_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: asset_categories asset_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_name_key UNIQUE (name);


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: asset_categories asset_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_slug_key UNIQUE (slug);


--
-- Name: asset_deletion_log asset_deletion_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_log
    ADD CONSTRAINT asset_deletion_log_pkey PRIMARY KEY (id);


--
-- Name: assets_aud assets_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets_aud
    ADD CONSTRAINT assets_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assets assets_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_serial_number_key UNIQUE (serial_number);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);


--
-- Name: customers_aud customers_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_aud
    ADD CONSTRAINT customers_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: dashboard_snapshots dashboard_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_snapshots
    ADD CONSTRAINT dashboard_snapshots_pkey PRIMARY KEY (id);


--
-- Name: fiber_core fiber_core_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_core
    ADD CONSTRAINT fiber_core_pkey PRIMARY KEY (id);


--
-- Name: fiber_splice fiber_splice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_splice
    ADD CONSTRAINT fiber_splice_pkey PRIMARY KEY (id);


--
-- Name: map_features_cache map_features_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.map_features_cache
    ADD CONSTRAINT map_features_cache_pkey PRIMARY KEY (feature_id, feature_type);


--
-- Name: material_prices material_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_prices
    ADD CONSTRAINT material_prices_pkey PRIMARY KEY (id);


--
-- Name: network_edges_aud network_edges_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges_aud
    ADD CONSTRAINT network_edges_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: network_edges network_edges_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT network_edges_code_key UNIQUE (code);


--
-- Name: network_edges network_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT network_edges_pkey PRIMARY KEY (id);


--
-- Name: network_edges_vertices_pgr network_edges_vertices_pgr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges_vertices_pgr
    ADD CONSTRAINT network_edges_vertices_pgr_pkey PRIMARY KEY (id);


--
-- Name: network_event_history_old network_event_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_event_history_old
    ADD CONSTRAINT network_event_history_pkey PRIMARY KEY (id);


--
-- Name: network_event_history network_event_history_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_event_history
    ADD CONSTRAINT network_event_history_pkey1 PRIMARY KEY (id);


--
-- Name: network_nodes_aud network_nodes_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes_aud
    ADD CONSTRAINT network_nodes_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: network_nodes network_nodes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT network_nodes_code_key UNIQUE (code);


--
-- Name: network_nodes network_nodes_osmid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT network_nodes_osmid_key UNIQUE (osmid);


--
-- Name: network_nodes network_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT network_nodes_pkey PRIMARY KEY (id);


--
-- Name: odc_aud odc_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odc_aud
    ADD CONSTRAINT odc_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: odc odc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odc
    ADD CONSTRAINT odc_pkey PRIMARY KEY (id);


--
-- Name: odp_aud odp_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odp_aud
    ADD CONSTRAINT odp_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: odp odp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odp
    ADD CONSTRAINT odp_pkey PRIMARY KEY (id);


--
-- Name: olt_aud olt_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olt_aud
    ADD CONSTRAINT olt_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: olt olt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olt
    ADD CONSTRAINT olt_pkey PRIMARY KEY (id);


--
-- Name: organization_configs_aud organization_configs_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_configs_aud
    ADD CONSTRAINT organization_configs_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: organization_configs organization_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_configs
    ADD CONSTRAINT organization_configs_pkey PRIMARY KEY (id);


--
-- Name: organizations_aud organizations_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_aud
    ADD CONSTRAINT organizations_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: permissions_aud permissions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions_aud
    ADD CONSTRAINT permissions_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: project_members_aud project_members_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members_aud
    ADD CONSTRAINT project_members_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: projects_aud projects_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects_aud
    ADD CONSTRAINT projects_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: revinfo revinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revinfo
    ADD CONSTRAINT revinfo_pkey PRIMARY KEY (id);


--
-- Name: role_permissions_aud role_permissions_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions_aud
    ADD CONSTRAINT role_permissions_aud_pkey PRIMARY KEY (rev, permission_id, role_id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles_aud roles_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_aud
    ADD CONSTRAINT roles_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: splitter_port splitter_port_node_id_port_number_direction_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splitter_port
    ADD CONSTRAINT splitter_port_node_id_port_number_direction_key UNIQUE (node_id, port_number, direction);


--
-- Name: splitter_port splitter_port_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splitter_port
    ADD CONSTRAINT splitter_port_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans_aud subscription_plans_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans_aud
    ADD CONSTRAINT subscription_plans_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (config_key);


--
-- Name: user_devices uk1cgnvoah1hbh8ls9l785okbkr; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT uk1cgnvoah1hbh8ls9l785okbkr UNIQUE (user_id, device_fingerprint);


--
-- Name: projects uk_clujw4wu21d33ssgde022aymk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT uk_clujw4wu21d33ssgde022aymk UNIQUE (code);


--
-- Name: blocked_ips uk_ko3tbku359aithoitmjdliq0a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT uk_ko3tbku359aithoitmjdliq0a UNIQUE (ip_address_or_cidr);


--
-- Name: subscription_plans uk_oim1kg8luw8o6q3ayhcup6vtl; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT uk_oim1kg8luw8o6q3ayhcup6vtl UNIQUE (name);


--
-- Name: material_prices uk_qv61c375a4n0dih1jlxp31bvx; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_prices
    ADD CONSTRAINT uk_qv61c375a4n0dih1jlxp31bvx UNIQUE (material_name);


--
-- Name: roles uk_roles_name_org; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uk_roles_name_org UNIQUE (name, organization_id);


--
-- Name: splitter_port ukg3d7ej0jbms374hokscdgtylc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splitter_port
    ADD CONSTRAINT ukg3d7ej0jbms374hokscdgtylc UNIQUE (node_id, port_number, direction);


--
-- Name: roles ukogtyde3p678ej48s9ilm3wdj5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT ukogtyde3p678ej48s9ilm3wdj5 UNIQUE (name, organization_id);


--
-- Name: user_audit_logs user_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_audit_logs
    ADD CONSTRAINT user_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: users_aud users_aud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_aud
    ADD CONSTRAINT users_aud_pkey PRIMARY KEY (rev, id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_edges_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_edges_geom ON public.network_edges USING gist (geom);


--
-- Name: idx_event_asset_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_asset_code ON public.network_event_history_old USING btree (asset_code);


--
-- Name: idx_event_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_timestamp ON public.network_event_history_old USING btree ("timestamp");


--
-- Name: idx_map_cache_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_map_cache_geom ON public.map_features_cache USING gist (geom);


--
-- Name: idx_map_cache_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_map_cache_project ON public.map_features_cache USING btree (project_id);


--
-- Name: idx_mv_clustered_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_clustered_geom ON public.mv_clustered_nodes USING gist (geom);


--
-- Name: idx_mv_clustered_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_clustered_id ON public.mv_clustered_nodes USING btree (id);


--
-- Name: idx_net_event_asset_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_net_event_asset_code ON public.network_event_history USING btree (asset_code);


--
-- Name: idx_net_event_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_net_event_timestamp ON public.network_event_history USING btree ("timestamp");


--
-- Name: idx_nodes_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_geom ON public.network_nodes USING gist (geom);


--
-- Name: idx_snapshot_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_snapshot_recorded_at ON public.dashboard_snapshots USING btree (recorded_at);


--
-- Name: asset_categories fk1ivuf8xx96ve0godty3i0j5na; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT fk1ivuf8xx96ve0godty3i0j5na FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: splitter_port fk1m1j72trgb2m3f0uv1tu6njky; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.splitter_port
    ADD CONSTRAINT fk1m1j72trgb2m3f0uv1tu6njky FOREIGN KEY (connected_core_id) REFERENCES public.fiber_core(id);


--
-- Name: organization_configs_aud fk4pn8a7s96r321x9lefvfwm65b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_configs_aud
    ADD CONSTRAINT fk4pn8a7s96r321x9lefvfwm65b FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: subscription_plans_aud fk5b2kcna1rg24mpserso5a7ine; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans_aud
    ADD CONSTRAINT fk5b2kcna1rg24mpserso5a7ine FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: permissions fk5do92q6p8dv7qij2lsea6aeil; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk5do92q6p8dv7qij2lsea6aeil FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: role_permissions_aud fk5nhmbkd3132pnqiwtkps4v7d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions_aud
    ADD CONSTRAINT fk5nhmbkd3132pnqiwtkps4v7d FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: assets_aud fk5smxd9xxni14gcjvkgrxl7wqp; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets_aud
    ADD CONSTRAINT fk5smxd9xxni14gcjvkgrxl7wqp FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: assets fk6aqk337s80ypynfi4xfsld7x7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fk6aqk337s80ypynfi4xfsld7x7 FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: olt fk6s4uybsmp8hi7b4x074mv7973; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olt
    ADD CONSTRAINT fk6s4uybsmp8hi7b4x074mv7973 FOREIGN KEY (id) REFERENCES public.network_nodes(id);


--
-- Name: odp fk6xmhuixk7sxnrff9dyi6rqlew; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odp
    ADD CONSTRAINT fk6xmhuixk7sxnrff9dyi6rqlew FOREIGN KEY (id) REFERENCES public.network_nodes(id);


--
-- Name: asset_categories fk6yug8vooa13v5xj7dqow955f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT fk6yug8vooa13v5xj7dqow955f FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: users fk902wn47cndp7hjhfvvb48brg; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk902wn47cndp7hjhfvvb48brg FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: fiber_splice fk9etfnnfn3mrb3cotxddrq2cfe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_splice
    ADD CONSTRAINT fk9etfnnfn3mrb3cotxddrq2cfe FOREIGN KEY (from_core_id) REFERENCES public.fiber_core(id);


--
-- Name: odc fk9p3gu77dxt44nq3akdx0d7k4b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odc
    ADD CONSTRAINT fk9p3gu77dxt44nq3akdx0d7k4b FOREIGN KEY (olt_id) REFERENCES public.olt(id);


--
-- Name: project_members fk9txtbivqx2b9yjt415fyrnrm7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fk9txtbivqx2b9yjt415fyrnrm7 FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: network_edges fk_network_edges_org; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT fk_network_edges_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: network_nodes fk_network_nodes_org; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT fk_network_nodes_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: project_members fk_project_members_org; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fk_project_members_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: network_edges_aud fkb0plupnemv0pukcl86y3a19xh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges_aud
    ADD CONSTRAINT fkb0plupnemv0pukcl86y3a19xh FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: odp_aud fkb103w2uja1o101usjixrb4cbo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odp_aud
    ADD CONSTRAINT fkb103w2uja1o101usjixrb4cbo FOREIGN KEY (rev, id) REFERENCES public.network_nodes_aud(rev, id);


--
-- Name: permissions_aud fkbcjh1knyfnk51nv2cllrct4iw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions_aud
    ADD CONSTRAINT fkbcjh1knyfnk51nv2cllrct4iw FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: network_edges fkbt4jn290l32wypblm2fd4iyxf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT fkbt4jn290l32wypblm2fd4iyxf FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: users_aud fkc4vk4tui2la36415jpgm9leoq; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_aud
    ADD CONSTRAINT fkc4vk4tui2la36415jpgm9leoq FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: project_members_aud fkc9p9ut0twhogsql3m2t0jdxir; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members_aud
    ADD CONSTRAINT fkc9p9ut0twhogsql3m2t0jdxir FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: assets fkcwxkksxvxtrvv0sjtu5cgflep; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fkcwxkksxvxtrvv0sjtu5cgflep FOREIGN KEY (category_id) REFERENCES public.asset_categories(id);


--
-- Name: network_nodes fkd123g0wtdpyg9cpu5qiy00ndi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT fkd123g0wtdpyg9cpu5qiy00ndi FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_members fkdki1sp2homqsdcvqm9yrix31g; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fkdki1sp2homqsdcvqm9yrix31g FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: role_permissions fkegdk29eiy7mdtefy5c7eirr6e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkegdk29eiy7mdtefy5c7eirr6e FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: user_audit_logs fkf0tyimrpu0twxfslxf450jj8o; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_audit_logs
    ADD CONSTRAINT fkf0tyimrpu0twxfslxf450jj8o FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: olt_aud fkfl46uej8iyg4xh4oj6kj7ii57; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olt_aud
    ADD CONSTRAINT fkfl46uej8iyg4xh4oj6kj7ii57 FOREIGN KEY (rev, id) REFERENCES public.network_nodes_aud(rev, id);


--
-- Name: organizations_aud fkfxeq0lp5j0m5ftym4oq5xo2yq; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations_aud
    ADD CONSTRAINT fkfxeq0lp5j0m5ftym4oq5xo2yq FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: customers_aud fkg6y0hv3yhjvc2fvqbcg1vj2ue; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers_aud
    ADD CONSTRAINT fkg6y0hv3yhjvc2fvqbcg1vj2ue FOREIGN KEY (rev, id) REFERENCES public.network_nodes_aud(rev, id);


--
-- Name: assets fkgqxc5up08htqakpryiaod3ujs; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fkgqxc5up08htqakpryiaod3ujs FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: project_members fkgul2el0qjk5lsvig3wgajwm77; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fkgul2el0qjk5lsvig3wgajwm77 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: fiber_core fkh6b3bm3qdt7ws9w394k1qo93k; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_core
    ADD CONSTRAINT fkh6b3bm3qdt7ws9w394k1qo93k FOREIGN KEY (cable_id) REFERENCES public.network_edges(id);


--
-- Name: odc_aud fkhvugpvhsp5yj5tqqt6gomwer4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odc_aud
    ADD CONSTRAINT fkhvugpvhsp5yj5tqqt6gomwer4 FOREIGN KEY (rev, id) REFERENCES public.network_nodes_aud(rev, id);


--
-- Name: user_devices fkik0n080vvur1fvdxtygwkt3m4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT fkik0n080vvur1fvdxtygwkt3m4 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fkj4xjs6i0exxcgearpuykol477; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkj4xjs6i0exxcgearpuykol477 FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: assets fkjkmeug4mm5eiopoh7rjshkc7y; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fkjkmeug4mm5eiopoh7rjshkc7y FOREIGN KEY (edge_id) REFERENCES public.network_edges(id);


--
-- Name: organization_configs fkjpofpxr46fiyt2l8ixf32nyxd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_configs
    ADD CONSTRAINT fkjpofpxr46fiyt2l8ixf32nyxd FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: projects_aud fkmj8bve3ipxgp5iw5j3ombgx6x; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects_aud
    ADD CONSTRAINT fkmj8bve3ipxgp5iw5j3ombgx6x FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: customers fkmu09qccf1pddyx7ubdtj5x61s; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fkmu09qccf1pddyx7ubdtj5x61s FOREIGN KEY (id) REFERENCES public.network_nodes(id);


--
-- Name: odp fkmx9phlpobhfwiflrpcsrtrl2i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odp
    ADD CONSTRAINT fkmx9phlpobhfwiflrpcsrtrl2i FOREIGN KEY (odc_id) REFERENCES public.odc(id);


--
-- Name: roles fkn2r9lxwnpqo2elh5qlj3dpuhx; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fkn2r9lxwnpqo2elh5qlj3dpuhx FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: role_permissions fkn5fotdgk8d1xvo8nav9uv3muc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkn5fotdgk8d1xvo8nav9uv3muc FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: network_nodes_aud fkni7klgal1aw7vcabta54pfvc7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_nodes_aud
    ADD CONSTRAINT fkni7klgal1aw7vcabta54pfvc7 FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: projects fkox6tplayrlog0orf9t1i9q4yn; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fkox6tplayrlog0orf9t1i9q4yn FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: users fkp56c1712k691lhsyewcssf40f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkp56c1712k691lhsyewcssf40f FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: organizations fkp9udh0oyer1klkkana1bs6ahe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT fkp9udh0oyer1klkkana1bs6ahe FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: roles fkqjj9a6xa11cu9ch24cjo4a7lc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fkqjj9a6xa11cu9ch24cjo4a7lc FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: assets fkqt8ejqcc7eb4gf2mnqpo2jy71; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT fkqt8ejqcc7eb4gf2mnqpo2jy71 FOREIGN KEY (node_id) REFERENCES public.network_nodes(id);


--
-- Name: customers fkrfj4d7edwgj5vou4qux0i4bbb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fkrfj4d7edwgj5vou4qux0i4bbb FOREIGN KEY (odp_id) REFERENCES public.odp(id);


--
-- Name: odc fkrnlk8wrxejcdkjxk64b3p2gf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odc
    ADD CONSTRAINT fkrnlk8wrxejcdkjxk64b3p2gf FOREIGN KEY (id) REFERENCES public.network_nodes(id);


--
-- Name: asset_categories_aud fksat19c3jkb6rgg75ybx13pg7d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories_aud
    ADD CONSTRAINT fksat19c3jkb6rgg75ybx13pg7d FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- Name: fiber_splice fksfqav5tpkkvny1xspoh3b9ywx; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiber_splice
    ADD CONSTRAINT fksfqav5tpkkvny1xspoh3b9ywx FOREIGN KEY (to_core_id) REFERENCES public.fiber_core(id);


--
-- Name: roles_aud fkt0mnl3rej2p0h9gxnbalf2kdd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_aud
    ADD CONSTRAINT fkt0mnl3rej2p0h9gxnbalf2kdd FOREIGN KEY (rev) REFERENCES public.revinfo(id);


--
-- PostgreSQL database dump complete
--

\unrestrict NLJXnSe0BK7pIUIo5yPTtdnfvhTgp7YtVmTg4rX4KiJP4NyuT4jYrXg9BJuFp10


-- =========================================================================
-- SEED DATA FOR FRESH SETUP (SUPERADMIN & CORE INFRASTRUCTURE)
-- =========================================================================

-- Disable foreign key triggers temporarily for seeding
SET session_replication_role = 'replica';

-- 1. Seed Roles (roles table has id of type bigint)
INSERT INTO public.roles (id, name, display_name, description, is_system_role) VALUES 
(1, 'super_admin', 'Super Administrator', 'Full system access', true),
(2, 'admin', 'Administrator', 'Project management access', true),
(3, 'technician', 'Technician', 'Field operations access', true),
(4, 'viewer', 'Viewer', 'Read-only access', true),
(5, 'supervisor', 'Supervisor', 'Monitoring and report access', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Default Organization
INSERT INTO public.organizations (id, name, slug, description, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Organization', 'default', 'Primary organization after reset', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Default Project
INSERT INTO public.projects (id, name, organization_id) 
VALUES ('00000000-0000-0000-0000-000000000002', 'FTTH GIS PROJECT', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Super Admin User (Linked to default Project and Role)
INSERT INTO public.users (
    id, 
    username, 
    email, 
    full_name, 
    role_id, 
    status, 
    created_at, 
    project_id,
    organization_id
)
VALUES (
    '774174cd-6d01-46d6-aae5-0586a699fd22', 
    'xsuperadmin', 
    'superadmin@example.com', 
    'Super Administrator', 
    1, 
    'ACTIVE', 
    NOW(), 
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Restore foreign key triggers
SET session_replication_role = 'origin';

-- Verify Seeding
SELECT 'Seeding Complete' as status;
SELECT count(*) as total_users FROM public.users;
SELECT count(*) as total_roles FROM public.roles;
SELECT count(*) as total_organizations FROM public.organizations;
SELECT count(*) as total_projects FROM public.projects;
