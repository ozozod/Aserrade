-- Backup Aserradero DB - 2025-12-08T01:55:23.868Z

SET FOREIGN_KEY_CHECKS = 0;

-- Tabla: clientes (3 registros)
DELETE FROM clientes;
INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) VALUES (2, 'DON TINO (ZUCCHINI)', '', '', '', '', '2025-12-04 21:15:31', '2025-12-08 04:42:20');
INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) VALUES (3, 'DON TINO (UVA)', '', '', '', '', '2025-12-05 18:43:45', '2025-12-08 04:42:20');
INSERT INTO clientes (id, nombre, telefono, direccion, email, observaciones, created_at, updated_at) VALUES (4, 'GARUFFO', '', '', '', '', '2025-12-05 20:03:47', '2025-12-08 04:42:20');

-- Tabla: articulos (12 registros)
DELETE FROM articulos;
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (12, 'JAULA PARA BERENJENA ', '', '2300.00', 1, 2, '0001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 17:16:08', '2025-12-08 04:42:20');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (13, 'PALLETS', '', '4000.00', 1, NULL, '0002', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 17:16:38', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (14, 'CH DE VUELTA', '', '0.00', 1, NULL, '0003', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 17:17:06', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (15, '17/11 - SALDO A FAVOR JO', '', '0.00', 1, NULL, '0004', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 17:21:38', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (16, 'BANDEJAS DE UVA ', '', '2150.00', 1, 3, '0005', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 18:46:23', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (17, 'CAJAS MARCADAS PARA ZUCCHINI', '', '2200.00', 1, 2, '0006', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 19:01:15', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (18, 'PULGADA SECA 2 X 1', '', '225.00', 1, NULL, '0007', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:04:48', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (19, 'PULGADA SECA 2 X 2', '', '225.00', 1, NULL, '0008', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:05:29', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (20, 'LISTONES DE 2 X 2 X 2.2', '', '220.00', 1, NULL, '0009', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:06:56', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (21, 'LISTONES 2 X 1 X 2.2', '', '220.00', 1, NULL, '0010', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:07:29', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (22, 'CH ELECT DE VUELTA', '', '0.00', 1, NULL, '0011', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:31:09', '2025-12-08 04:42:21');
INSERT INTO articulos (id, nombre, descripcion, precio_base, activo, cliente_id, codigo, medida, cabezal, costado, fondo, taco, esquinero, despeje, created_at, updated_at) VALUES (23, 'GASTOS CH ELEC DE VUELTA', '', '0.00', 1, NULL, '0012', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-05 20:33:28', '2025-12-08 04:42:21');

-- Tabla: remitos (13 registros)
DELETE FROM remitos;
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (28, 2, '2025-10-18 03:00:00', 'AUTO-20251205-001', 'Pago Parcial', '2712400.00', '', NULL, '2025-12-05 17:22:39', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (29, 2, '2025-10-18 03:00:00', '14956', 'Pagado', '587600.00', '', NULL, '2025-12-05 18:02:03', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (30, 2, '2025-10-22 03:00:00', '14504', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:04:00', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (31, 2, '2025-11-07 03:00:00', 'N°29167632', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:05:11', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (32, 2, '2025-11-11 03:00:00', '14608', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:06:29', '2025-12-08 04:42:21');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (34, 2, '2025-11-18 03:00:00', '14707', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:07:39', '2025-12-08 04:42:21');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (35, 2, '2025-11-25 03:00:00', '14621', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:09:56', '2025-12-08 04:42:21');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (36, 3, '2025-10-18 03:00:00', '14707', 'Pendiente', '0.00', '', NULL, '2025-12-05 18:48:27', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (39, 4, '2025-09-17 03:00:00', '14469', 'Pagado', '4878720.00', '', NULL, '2025-12-05 20:21:24', '2025-12-08 04:42:21');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (40, 4, '2025-11-12 03:00:00', 'N°61595970', 'Pendiente', '0.00', '', NULL, '2025-12-05 20:33:02', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (42, 4, '2025-11-12 03:00:00', 'AUTO-20251205-002', 'Pendiente', '0.00', '', NULL, '2025-12-05 20:35:09', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (43, 4, '2025-11-17 03:00:00', 'N°61596039', 'Pendiente', '0.00', '', NULL, '2025-12-05 20:36:17', '2025-12-08 04:42:22');
INSERT INTO remitos (id, cliente_id, fecha, numero, estado_pago, monto_pagado, observaciones, foto_path, created_at, updated_at) VALUES (44, 4, '2025-11-17 03:00:00', 'N°61596135', 'Pendiente', '0.00', '', NULL, '2025-12-05 20:37:04', '2025-12-08 04:42:22');

-- Tabla: remito_articulos (16 registros)
DELETE FROM remito_articulos;
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (44, 28, 15, '17/11 - SALDO A FAVOR JO', '1.00', '42128774.00', '42128774.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (46, 29, 12, 'JAULA PARA BERENJENA ', '252.00', '2300.00', '579600.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (47, 29, 13, 'PALLETS', '2.00', '4000.00', '8000.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (48, 30, 12, 'JAULA PARA BERENJENA ', '956.00', '2300.00', '2198800.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (49, 31, 14, 'CH DE VUELTA', '1.00', '3300000.00', '3300000.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (53, 32, 12, 'JAULA PARA BERENJENA ', '1011.00', '2300.00', '2325300.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (54, 32, 13, 'PALLETS', '8.00', '4000.00', '32000.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (55, 34, 12, 'JAULA PARA BERENJENA ', '1008.00', '2300.00', '2318400.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (56, 35, 12, 'JAULA PARA BERENJENA ', '1008.00', '2300.00', '2318400.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (57, 36, 16, 'BANDEJAS DE UVA ', '1680.00', '2150.00', '3612000.00', '2025-12-08 04:42:23');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (64, 39, 20, 'LISTONES DE 2 X 2 X 2.2', '6336.00', '220.00', '1393920.00', '2025-12-08 04:42:22');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (65, 39, 21, 'LISTONES 2 X 1 X 2.2', '15840.00', '220.00', '3484800.00', '2025-12-08 04:42:22');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (66, 40, 22, 'CH ELECT DE VUELTA', '1.00', '609840.00', '609840.00', '2025-12-08 04:42:22');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (67, 42, 23, 'GASTOS CH ELEC DE VUELTA', '1.00', '3000.00', '3000.00', '2025-12-08 04:42:22');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (68, 43, 22, 'CH ELECT DE VUELTA', '1.00', '609840.00', '609840.00', '2025-12-08 04:42:22');
INSERT INTO remito_articulos (id, remito_id, articulo_id, articulo_nombre, cantidad, precio_unitario, precio_total, created_at) VALUES (69, 44, 22, 'CH ELECT DE VUELTA', '1.00', '609840.00', '609840.00', '2025-12-08 04:42:22');

-- Tabla: pagos (19 registros)
DELETE FROM pagos;
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (54, 29, '2025-11-26 03:00:00', '587600.00', '[OCULTO] Pago agrupado - Remito 14956 - $ 587.600,00', '2025-12-05 18:15:01');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (55, 28, '2025-11-26 03:00:00', '2712400.00', '[OCULTO] Pago agrupado - Remito AUTO-20251205-001 - $ 2.712.400,00', '2025-12-05 18:15:01');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (56, 29, '2025-11-26 03:00:00', '0.00', 'CH ELEC N°03119206 (EURO) POR CH DE VUELTA | REMITOS_DETALLE:[{"remito_id":29,"remito_numero":"14956","monto":587600},{"remito_id":28,"remito_numero":"AUTO-20251205-001","monto":2712400}]', '2025-12-05 18:15:01');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (57, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:24:27');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (58, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596353 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:24:27');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (59, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:25:14');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (60, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596314 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:25:14');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (61, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:25:54');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (62, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596265 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:25:54');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (63, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:27:02');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (64, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596167 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:27:02');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (65, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:27:39');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (66, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596075 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:27:39');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (67, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:28:19');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (68, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596039 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:28:19');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (69, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:28:55');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (70, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61595970 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:28:55');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (71, 39, '2025-09-26 03:00:00', '609840.00', '[OCULTO] Pago agrupado - Remito 14469 - $ 609.840,00', '2025-12-05 20:29:34');
INSERT INTO pagos (id, remito_id, fecha, monto, observaciones, created_at) VALUES (72, 39, '2025-09-26 03:00:00', '0.00', 'PAGO A JO CH ELEC N°61596135 | REMITOS_DETALLE:[{"remito_id":39,"remito_numero":"14469","monto":609840}]', '2025-12-05 20:29:34');

SET FOREIGN_KEY_CHECKS = 1;
