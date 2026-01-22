-- ============================================
-- MIGRACIÓN DE DATOS: SUPABASE -> HOSTINGER
-- Fecha: 4/12/2025, 10:34:19
-- ============================================

-- Deshabilitar verificaciones de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Datos de clientes
-- Total: 1 registros

INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) VALUES (2, 'DON TINO (ZUCCHINI)', '', '', '', '', '2025-12-04T18:15:30.670619', '2025-12-04T18:15:30.670619');

-- Datos de articulos
-- Total: 9 registros

INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (3, 'CAJA MARCADA PARA ZUCCHINI', '', 2200, 1, 2, NULL, '21 X 28 X 48', '20 X 28 MARCADO', '2 TABLAS DE 8 X 48( 1 TABLA MARCADA DON TINO Y 1 TABLA BLANCA)', 'CONVENCIONAL', 'CONVENCIONAL', 'A 21 CM', NULL, '2025-12-04T18:17:56.895286', '2025-12-04T18:17:56.895286');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (4, 'LISTONES DE 1/2 Y 1 1/2', '', 412, 1, NULL, NULL, '', '', '', '', '', '', NULL, '2025-12-04T18:18:40.405475', '2025-12-04T18:18:40.405475');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (5, 'TUTORES EZEQUIEL', '', 950, 1, 2, NULL, '', '', '', '', '', '', NULL, '2025-12-04T18:19:18.297143', '2025-12-04T18:19:18.297143');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (6, 'TUTORES MARIO MONTAÑA', '', 350000, 1, 2, NULL, '', '', '', '', '', '', '', '2025-12-04T18:19:46.737736', '2025-12-04T19:33:31.641926');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (7, 'PALLETS', '', 4000, 1, NULL, NULL, '', '', '', '', '', '', NULL, '2025-12-04T18:20:07.212412', '2025-12-04T18:20:07.212412');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (8, 'CAJA BLANCA PARA ZUCCHINI', '', 2100, 1, 2, NULL, '21 X 28 X 48', '20 X 28', '2 TABLAS DE 8 X 48', 'CONVENCIONAL', 'CONVENCIONAL', 'A 21 CM', '', '2025-12-04T18:21:46.766277', '2025-12-04T19:27:44.836069');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (9, 'CH DE VUELTA', '', 0, 1, NULL, NULL, '', '', '', '', '', '', NULL, '2025-12-04T18:27:58.862718', '2025-12-04T18:27:58.862718');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (10, 'FLETE CON MAQUINAS', '', 200000, 1, 2, NULL, '', '', '', '', '', '', NULL, '2025-12-04T19:28:26.348878', '2025-12-04T19:28:26.348878');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (11, 'JAULA PARA BERENJENA', '', 2300, 1, 2, NULL, '22 X 28 48', '20 X 28 MARCADO', '2 TABLAS DE 8 X 48( 1 TABLA MARCADA \"DON TINO\" Y 1 TABLA BLANCA)', 'CONVENCIONAL', 'CONVENCIONAL', 'A 22 CM', NULL, '2025-12-04T19:31:55.886996', '2025-12-04T19:31:55.886996');

-- Datos de remitos
-- Total: 22 registros

INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (3, 2, '2025-05-07', '13099', 'Pagado', 7151176, '', NULL, '2025-12-04T18:23:06.139578', '2025-12-04T20:58:15.051213');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (4, 2, '2025-06-04', '10884', 'Pagado', 4435200, '', NULL, '2025-12-04T18:26:48.959711', '2025-12-04T20:58:14.142396');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (5, 2, '2025-06-05', 'N°90000361', 'Pendiente', 0, '', NULL, '2025-12-04T18:29:11.501832', '2025-12-04T20:58:13.141643');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (6, 2, '2025-06-05', 'N°90000362', 'Pago Parcial', 64800, '', NULL, '2025-12-04T18:29:50.606359', '2025-12-04T20:58:12.186129');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (7, 2, '2025-06-05', 'N°90000363', 'Pagado', 600000, '', NULL, '2025-12-04T18:30:19.998158', '2025-12-04T20:58:11.228192');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (8, 2, '2025-06-13', '13624', 'Pendiente', 0, '', NULL, '2025-12-04T18:44:55.014365', '2025-12-04T20:58:10.351098');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (10, 2, '2025-08-01', '14056', 'Pendiente', 0, '', NULL, '2025-12-04T18:46:57.085044', '2025-12-04T20:58:09.428862');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (11, 2, '2025-08-15', '13950', 'Pendiente', 0, '', NULL, '2025-12-04T18:48:30.796297', '2025-12-04T20:58:08.506027');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (13, 2, '2025-08-18', '13859', 'Pendiente', 0, '', NULL, '2025-12-04T18:50:03.549154', '2025-12-04T20:58:07.585971');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (14, 2, '2025-08-26', 'AUTO-20251204-001', 'Pendiente', 0, '', NULL, '2025-12-04T18:50:55.061664', '2025-12-04T20:58:06.661543');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (15, 2, '2025-08-26', 'AUTO-20251204-002', 'Pendiente', 0, '', NULL, '2025-12-04T19:11:26.241855', '2025-12-04T20:58:05.737254');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (16, 2, '2025-09-16', '14202', 'Pendiente', 0, '', NULL, '2025-12-04T19:24:47.405841', '2025-12-04T20:58:04.82494');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (17, 2, '2025-09-23', '14473', 'Pendiente', 0, '', NULL, '2025-12-04T19:26:00.209257', '2025-12-04T20:58:03.900089');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (18, 2, '2025-09-30', '14403', 'Pendiente', 0, '', NULL, '2025-12-04T19:27:56.94053', '2025-12-04T20:58:02.055565');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (19, 2, '2025-10-17', 'AUTO-20251204-003', 'Pendiente', 0, '', NULL, '2025-12-04T19:29:01.984512', '2025-12-04T20:58:01.129507');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (20, 2, '2025-10-18', '14956', 'Pendiente', 0, '', NULL, '2025-12-04T19:32:49.17659', '2025-12-04T20:58:00.203698');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (21, 2, '2025-10-22', '14504', 'Pendiente', 0, '', NULL, '2025-12-04T19:33:37.515923', '2025-12-04T20:57:59.282316');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (22, 2, '2025-11-07', 'N°29167632', 'Pendiente', 0, '', NULL, '2025-12-04T19:34:35.289882', '2025-12-04T20:57:58.367464');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (23, 2, '2025-11-11', '14608', 'Pendiente', 0, '', NULL, '2025-12-04T19:35:21.995753', '2025-12-04T20:57:57.440491');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (24, 2, '2025-11-18', '14707', 'Pendiente', 0, '', NULL, '2025-12-04T19:35:59.962004', '2025-12-04T20:57:56.318645');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (25, 2, '2025-11-25', '14621', 'Pendiente', 0, '', NULL, '2025-12-04T19:36:33.570398', '2025-12-04T20:57:55.34808');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (26, 2, '2025-09-23', '14216', 'Pendiente', 0, '', NULL, '2025-12-04T19:45:23.910507', '2025-12-04T20:58:02.980932');

-- Datos de remito_articulos
-- Total: 28 registros

INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (6, 3, 4, 'LISTONES DE 1/2 Y 1 1/2', 1000, 412, 412000, '2025-12-04T18:23:06.446559');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (7, 4, 3, 'CAJA MARCADA PARA ZUCCHINI', 2016, 2200, 4435200, '2025-12-04T18:26:49.364972');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (13, 7, 9, 'CH DE VUELTA', 1, 600000, 600000, '2025-12-04T18:35:42.258139');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (15, 5, 9, 'CH DE VUELTA', 1, 600000, 600000, '2025-12-04T18:40:15.008943');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (16, 6, 9, 'CH DE VUELTA', 1, 600000, 600000, '2025-12-04T18:40:35.319734');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (17, 8, 3, 'CAJA MARCADA PARA ZUCCHINI', 3024, 2200, 6652800, '2025-12-04T18:44:55.287803');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (18, 10, 3, 'CAJA MARCADA PARA ZUCCHINI', 3024, 2200, 6652800, '2025-12-04T18:46:57.411193');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (19, 11, 3, 'CAJA MARCADA PARA ZUCCHINI', 1638, 2200, 3603600, '2025-12-04T18:48:31.083827');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (20, 13, 3, 'CAJA MARCADA PARA ZUCCHINI', 1386, 2200, 3049200, '2025-12-04T18:50:03.863052');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (21, 14, 5, 'TUTORES EZEQUIEL', 871, 950, 827450, '2025-12-04T18:50:55.370586');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (22, 15, 6, 'TUTORES MARIO MONTAÑA', 1, 350000, 350000, '2025-12-04T19:11:26.645481');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (23, 16, 3, 'CAJA MARCADA PARA ZUCCHINI', 756, 2200, 1663200, '2025-12-04T19:24:47.708111');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (24, 16, 8, 'CAJA BLANCA PARA ZUCCHINI', 1512, 2100, 3175200, '2025-12-04T19:24:47.708111');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (25, 16, 7, 'PALLETS', 18, 4000, 72000, '2025-12-04T19:24:47.708111');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (29, 18, 3, 'CAJA MARCADA PARA ZUCCHINI', 1890, 2200, 4158000, '2025-12-04T19:27:57.254858');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (30, 19, 10, 'FLETE CON MAQUINAS', 1, 200000, 200000, '2025-12-04T19:29:02.347761');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (31, 20, 11, 'JAULA PARA BERENJENA', 252, 2300, 579600, '2025-12-04T19:32:49.518824');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (32, 20, 7, 'PALLETS', 2, 4000, 8000, '2025-12-04T19:32:49.518824');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (33, 21, 11, 'JAULA PARA BERENJENA', 956, 2300, 2198800, '2025-12-04T19:33:37.862112');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (34, 22, 9, 'CH DE VUELTA', 1, 3300000, 3300000, '2025-12-04T19:34:35.55815');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (35, 23, 11, 'JAULA PARA BERENJENA', 1011, 2300, 2325300, '2025-12-04T19:35:22.274037');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (36, 23, 7, 'PALLETS', 8, 4000, 32000, '2025-12-04T19:35:22.274037');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (38, 25, 11, 'JAULA PARA BERENJENA', 1008, 2300, 2318400, '2025-12-04T19:36:33.860141');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (39, 17, 3, 'CAJA MARCADA PARA ZUCCHINI', 3024, 2200, 6652800, '2025-12-04T19:44:23.776719');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (40, 17, 7, 'PALLETS', 16, 4000, 64000, '2025-12-04T19:44:23.776719');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (41, 26, 3, 'CAJA MARCADA PARA ZUCCHINI', 3276, 2200, 7207200, '2025-12-04T19:45:24.322967');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (42, 26, 7, 'PALLETS', 26, 4000, 104000, '2025-12-04T19:45:24.322967');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (43, 24, 11, 'JAULA PARA BERENJENA', 1008, 2300, 2318400, '2025-12-04T20:57:52.627227');

-- Datos de pagos
-- Total: 8 registros

INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (5, 3, '2025-05-29', 7151176, '[OCULTO] Pago agrupado - Remito 13099 - $ 7.151.176', '2025-12-04T18:24:02.123');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (6, 3, '2025-05-29', 0, 'Pago completo | REMITOS_DETALLE:[{\"remito_id\":3,\"remito_numero\":\"13099\",\"monto\":7151176}]', '2025-12-04T18:24:02.123');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (11, 4, '2025-06-10', 1800000, '[OCULTO] Pago agrupado - Remito 10884 - $ 1.800.000', '2025-12-04T18:42:02.977503');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (12, 4, '2025-06-10', 0, 'TRANSF N°0872(MP AS) | REMITOS_DETALLE:[{\"remito_id\":4,\"remito_numero\":\"10884\",\"monto\":1800000}]', '2025-12-04T18:42:02.977503');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (13, 4, '2025-11-26', 2635200, '[OCULTO] Pago agrupado - Remito 10884 - $ 2.635.200', '2025-12-04T19:37:54.097087');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (14, 7, '2025-11-26', 600000, '[OCULTO] Pago agrupado - Remito N°90000363 - $ 600.000', '2025-12-04T19:37:54.097087');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (15, 6, '2025-11-26', 64800, '[OCULTO] Pago agrupado - Remito N°90000362 - $ 64.800', '2025-12-04T19:37:54.097087');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (16, 4, '2025-11-26', 0, 'CH ELEC N°03119206(EURO)POR CH DE VUELTA | REMITOS_DETALLE:[{\"remito_id\":4,\"remito_numero\":\"10884\",\"monto\":2635200},{\"remito_id\":7,\"remito_numero\":\"N°90000363\",\"monto\":600000},{\"remito_id\":6,\"remito_numero\":\"N°90000362\",\"monto\":64800}]', '2025-12-04T19:37:54.097087');


-- Rehabilitar verificaciones de FK
SET FOREIGN_KEY_CHECKS = 1;

-- Actualizar AUTO_INCREMENT de cada tabla
ALTER TABLE clientes AUTO_INCREMENT = 3;
ALTER TABLE articulos AUTO_INCREMENT = 12;
ALTER TABLE remitos AUTO_INCREMENT = 27;
ALTER TABLE remito_articulos AUTO_INCREMENT = 44;
ALTER TABLE pagos AUTO_INCREMENT = 17;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
