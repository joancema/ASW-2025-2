-- Seed data para productos de inventario
-- Ejecutar después de que TypeORM cree las tablas

INSERT INTO productos (codigo, nombre, descripcion, precio, stock, categoria) VALUES
('PROD-001', 'Laptop Dell Inspiron 15', 'Laptop 15 pulgadas, Intel i5, 8GB RAM, 256GB SSD', 1200.00, 10, 'Electrónica'),
('PROD-002', 'Mouse Logitech M185', 'Mouse inalámbrico ergonómico con receptor USB', 25.50, 50, 'Accesorios'),
('PROD-003', 'Teclado Mecánico Redragon', 'Teclado mecánico RGB retroiluminado, switches blue', 89.99, 30, 'Accesorios'),
('PROD-004', 'Monitor Samsung 24 pulgadas', 'Monitor Full HD 24", 75Hz, panel IPS', 299.00, 15, 'Electrónica'),
('PROD-005', 'Webcam HD Logitech C270', 'Webcam 720p con micrófono integrado', 45.00, 25, 'Accesorios'),
('PROD-006', 'Auriculares Sony WH-1000XM4', 'Auriculares con cancelación de ruido activa', 349.99, 12, 'Audio'),
('PROD-007', 'Cable HDMI 2m', 'Cable HDMI 2.0 de 2 metros, soporta 4K', 12.50, 100, 'Cables'),
('PROD-008', 'SSD Samsung 1TB', 'Disco sólido interno 1TB SATA 2.5"', 159.00, 20, 'Almacenamiento');
