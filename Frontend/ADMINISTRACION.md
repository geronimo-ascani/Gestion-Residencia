# Cuentas del prototipo

El acceso usa correo y contraseña. La contraseña inicial es el primer apellido (respetando mayúsculas y acentos) seguido de los últimos tres dígitos numéricos del DNI, incluidos los ceros iniciales de ese sufijo. Ejemplo: Pérez Gómez + 30.000.123 → Pérez123.

El alta de administradores pide nombre, apellido, DNI y correo; muestra la contraseña inicial antes de guardar. El alta de alumnos ya separa nombre y apellido. Desde su ficha se crea la cuenta con correo y contraseña generada. Las cuentas nuevas quedan activas. Restablecer una suspensión conserva la contraseña personalizada.

Todas las cuentas de alumnos de ejemplo tienen correo y datos para obtener su contraseña inicial. La administradora inicial es ana@residencia.ar, DNI ficticio 30.000.123, contraseña Pérez123. Los alumnos de ejemplo usan los correos alumno01@example.com, etc.; sus apellidos y DNI se consultan en Alumnos. No se inventan correos para nuevas fichas sin correo.

Mi perfil permite editar el correo y cambiar la contraseña ingresando la actual y confirmando la nueva (mínimo 8 caracteres). El portal del alumno permite consultar su cuenta y cambiar su contraseña. El historial registra que se cambió una contraseña, sin incluirla ni mostrar su hash.

Los datos se guardan en localStorage de este navegador y la sesión en sessionStorage. Se almacenan hashes SHA-256 de contraseñas personalizadas; las iniciales se derivan de apellido y DNI. Es una demostración local, sin API ni autenticación del servidor. Los contratos siguen FECHA_REFERENCIA. Para un despliegue real se deben reemplazar el almacenamiento y la sesión por el backend, junto con la verificación de permisos y un hash de contraseñas adecuado en el servidor.
