# 🚀 Ejecutar Script SQL desde SSH

## Desde la Terminal SSH que ya tienes abierta:

### Paso 1: Subir el archivo SQL al servidor

Desde tu computadora (PowerShell), ejecuta:

```powershell
# Ir a la carpeta del script
cd "C:\Users\ozozo\Documents\aserradero v3\database"

# Subir el archivo al servidor usando SCP
scp setup_desarrollo_completo.sql root@31.97.246.42:/root/
```

Te pedirá la contraseña del servidor.

### Paso 2: Ejecutar el script desde SSH

En la terminal SSH del servidor, ejecuta:

```bash
mysql -u root -p < /root/setup_desarrollo_completo.sql
```

O si prefieres entrar a MySQL primero:

```bash
mysql -u root -p
```

Luego dentro de MySQL, ejecuta:

```sql
source /root/setup_desarrollo_completo.sql
```

---

## Alternativa: Copiar y pegar directamente

Si no quieres subir el archivo, puedes:

1. **Abrir el archivo** `setup_desarrollo_completo.sql` en tu editor
2. **Copiar todo el contenido**
3. **En la terminal SSH**, ejecutar:
   ```bash
   mysql -u root -p
   ```
4. **Pegar todo el contenido** del script
5. **Presionar Enter**

---

## Verificar que funcionó

Dentro de MySQL:

```sql
USE aserradero_dev;
SHOW TABLES;
```

Deberías ver:
- clientes
- articulos
- remitos
- remito_articulos
- pagos
- usuarios
- auditoria

```sql
SELECT * FROM usuarios;
```

Deberías ver el usuario admin.

