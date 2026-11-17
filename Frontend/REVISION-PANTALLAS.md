# Revisión del frontend

Fecha: 14/11/2026. Alcance: portal administrativo, portal del alumno y acceso.

## Resultado

Se revisaron las 50 definiciones de ruta de `app/routes.ts` (incluidos el índice y la ruta desconocida), las secciones que comparte el portal del alumno, los formularios y sus validaciones. Se corrigieron los fallos encontrados y se verificó la compilación final. El frontend queda preparado para comenzar la integración con el backend; sigue siendo un prototipo con datos locales, no un sistema listo para producción.

Las pruebas de navegador se realizaron con la compilación de producción en `http://localhost:5174`, separada del entorno de desarrollo de `5173`. Se conservaron los datos de desarrollo. En el almacenamiento del puerto de pruebas quedó un reclamo identificado como «Prueba QA: seguimiento entre portales», en revisión, con una respuesta de prueba.

## Cobertura de pantallas

| Área | Pantallas revisadas | Comprobación |
| --- | --- | --- |
| Acceso | Login, redirección de registro, recuperación, restablecimiento con y sin token | Renderizado, campos obligatorios, salida y redirección sin sesión. El envío de correo y la validación real del token requieren backend. |
| Panel administrativo | Resumen, pendientes y accesos a gestiones | Renderizado, enlaces y adaptación móvil. |
| Alumnos | Listado, ingreso y ficha | Datos, contactos, historial, acceso de cuenta y validación de documento duplicado. |
| Habitaciones | Listado, alta, detalle y asignación | Capacidad, duplicados, habitaciones inexistentes y conservación del historial. |
| Ambientes | Listado, alta y detalle con inventario | Renderizado y validaciones de nombres, tipos y cantidades. |
| Contratos | Listado, nuevo, detalle y baja | Fechas, importes, superposiciones, duración, vencimiento y parámetros de URL inválidos. |
| Facturación y cobros | Listados, emisión, factura y registro de cobro | Saldos, detalles, referencias y reglas de cobro, con pruebas automatizadas de pagos parciales y completos. |
| Multas | Listado, alta, detalle y edición | Importes, recargos, bloqueo de edición al facturar y acceso a factura relacionada. |
| Limpieza | Listado, nuevo grupo, detalle, edición, integrantes, asignación de ambiente y tareas | Rotación, formularios, registros inexistentes y ausencia de tareas configuradas. |
| Administración | Listado, alta, perfil de administrador y configuración | Renderizado, campos, permisos y validaciones de parámetros. |
| Reclamos administrativos | Bandeja y detalle | Caso creado desde alumno, respuesta, cambio de estado, historial y persistencia al recargar. |
| Alumno | Panel, contratos, facturas/pagos, factura, multas, multa, reclamos, nuevo reclamo, seguimiento, avisos, perfil y cambio de contraseña | Datos propios, historial de estadías, estados vacíos, enlaces y formularios. |
| Navegación y excepciones | Menús, notificaciones, enlaces, páginas inexistentes y registros ajenos | Cierre de sesión, separación entre alumnos, foco de teclado y avisos leídos persistentes. |

El recorrido principal administrativo se hizo en escritorio; se probaron además sus listados, detalles y formularios representativos a 390 × 844. Las secciones del alumno se recorrieron en móvil y se contrastaron en escritorio con dos cuentas. No se observaron desbordamientos horizontales de página en las vistas comprobadas; las tablas conservan desplazamiento interno.

## Fallos corregidos

- Las rutas del sistema ahora requieren una sesión válida y consultan la cuenta guardada y su estado actual. La navegación distingue alumno y administrador, y las operaciones administrativas comprueban el rol en el store.
- Cerrar sesión elimina la identidad anterior, incluidos datos opcionales que podían permanecer al cambiar de cuenta. «Mantener sesión iniciada» ahora diferencia la sesión de pestaña de la sesión recordada. En el almacenamiento de sesión se conserva solo la referencia de usuario.
- La lectura de datos guardados valida su estructura y migra campos incorporados al prototipo. Los datos ilegibles no se sustituyen por ejemplos: se muestra un error recuperable y la opción de descargar el contenido original. Los fallos de escritura se informan.
- Altas de alumnos, habitaciones y contratos verifican datos antes de guardar. Se rechazan documentos duplicados con otro formato, números de habitación equivalentes, capacidades inválidas, fechas inexistentes, importes inválidos y contratos superpuestos.
- Asignar habitación verifica alumno, existencia y capacidad, evita repetir la misma asignación y conserva los registros históricos.
- Los errores de alta y asignación se muestran en el formulario en lugar de interrumpir la pantalla o anunciar una operación exitosa.
- Los contratos admiten vencimientos del 1 al 31 y ajustan la duración predeterminada contando ambos extremos. Una duración de 365 días ya no genera 366. Las fechas inválidas en la URL no rompen la pantalla.
- Las multas incluidas en una factura muestran el importe congelado al emitirla, evitando diferencias entre el detalle de la multa y la factura. El concepto facturado usa el porcentaje real del recargo configurado.
- Las tareas de limpieza ausentes tienen un estado vacío. La rotación administrativa respeta la cantidad real de días y semanas del mes.
- Se sustituyeron enlaces con botones anidados por enlaces estilizados como botones, eliminando focos duplicados y HTML interactivo inválido.
- Los diálogos y el menú móvil mantienen el foco de teclado, permiten salir con Escape y devuelven el foco al control de origen. El menú móvil tiene un botón explícito para cerrar.
- Las rutas desconocidas muestran «Página no encontrada», con un acceso al panel correspondiente. Se retiró el mensaje incorrecto de sección en preparación y se actualizó el layout de compatibilidad para usar la navegación vigente.
- Se corrigieron fechas de avisos y la concordancia de «1 resultado».
- Los servicios de autenticación que todavía esperan backend no interpretan una respuesta HTML como una operación exitosa.

## Verificación

```text
node --test tests/*.test.mjs                         72 aprobadas, 0 fallidas
npm run typecheck                                  aprobado
npx tsc --noUnusedLocals --noUnusedParameters        aprobado
npm run build                                      aprobado
git diff --check                                   aprobado
```

La generación de tipos de React Router necesitó ejecutarse fuera del entorno restringido por un bloqueo EPERM de OneDrive sobre `.react-router/types`; luego completó correctamente.

En el navegador se verificaron registros inexistentes, enlaces a datos de otro alumno, acceso administrativo desde una cuenta de alumno, cierre y cambio de cuenta, formularios inválidos, lectura masiva de avisos, historial de contratos anteriores y el circuito de reclamos entre ambos roles. No se registraron errores o advertencias de consola en esos recorridos. No se cambiaron contraseñas de cuentas desde el navegador; esa lógica dispone de pruebas automatizadas.

## Puntos para comenzar el backend

1. Reemplazar `localStorage` y el store en memoria por una API y base de datos. Definir transacciones para asignaciones, facturación, cobros y estados de reclamos; la sincronización local entre pestañas no resuelve ediciones simultáneas de varios usuarios.
2. Implementar sesiones del servidor, autorización por rol y pertenencia de cada registro. Las comprobaciones actuales del cliente son parte de la interfaz y deben repetirse en el servidor.
3. Reemplazar las credenciales de demostración por gestión real de contraseñas, almacenamiento seguro en servidor y recuperación con correo y tokens de expiración. Los formularios de recuperación están preparados, pero el envío de correos aún no funciona.
4. Reproducir en la API las reglas de fechas, cupos, contratos superpuestos, importes, recargos, pagos parciales y facturas inmutables; no confiar en valores enviados por el navegador.
5. Registrar historial, actor y cambios en la misma transacción que cada operación. Persistir también las notificaciones y su lectura por usuario.
6. Sustituir la fecha de referencia de demostración (`20/10/2026`, en `app/lib/config.ts`) por una fecha de negocio definida con su zona horaria. Los reclamos y su historial ya usan el momento real de creación; esta diferencia se mantiene identificada para la integración.
7. Añadir a cada consulta de API sus estados de carga, error, reintento y paginación cuando exista el contrato de respuesta. Volver a probar las pantallas con respuestas reales, demoras, errores de red y concurrencia.

Esta revisión cubre los casos documentados; no sustituye las pruebas de integración con la API ni una prueba de aceptación con usuarios reales.
