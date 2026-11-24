-- Aplicar después de crear el esquema de Prisma y antes de exponer la aplicación.
-- Prisma usa una conexión PostgreSQL directa con permisos sobre estas tablas.
BEGIN;

DO $$
DECLARE
  tablas CONSTANT text[] := ARRAY[
    'roles', 'usuarios', 'sesiones', 'tokens_restablecimiento', 'notificaciones',
    'cambios_administrativos', 'alumnos', 'contactos_emergencia', 'habitaciones',
    'habitaciones_alumnos', 'contratos', 'facturas', 'detalles_factura', 'pagos',
    'cuotas_mensuales', 'multas', 'cambios_multa', 'grupos_de_limpieza',
    'grupos_limpieza_alumnos', 'ambientes', 'equipamiento_ambientes',
    'grupos_limpieza_ambientes', 'tareas_limpieza', 'reclamos',
    'seguimientos_reclamos', 'parametros_sistema', 'opciones_catalogo'
  ];
  nombre text;
  rol text;
  tabla regclass;
  secuencia regclass;
BEGIN
  FOREACH nombre IN ARRAY tablas LOOP
    tabla := to_regclass(format('%I.%I', 'public', nombre));
    IF tabla IS NULL THEN
      RAISE EXCEPTION 'Falta la tabla public.% del esquema de Prisma', nombre;
    END IF;

    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tabla);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM PUBLIC', tabla);
    FOR rol IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role') LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM %I', tabla, rol);
    END LOOP;

    FOR secuencia IN
      SELECT c.oid::regclass
      FROM pg_depend d
      JOIN pg_class c ON c.oid = d.objid AND c.relkind = 'S'
      WHERE d.classid = 'pg_class'::regclass
        AND d.refclassid = 'pg_class'::regclass
        AND d.refobjid = tabla
        AND d.deptype IN ('a', 'i')
    LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC', secuencia);
      FOR rol IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role') LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM %I', secuencia, rol);
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

COMMIT;
