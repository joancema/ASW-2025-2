-- Schema para el laboratorio de n8n
-- Tabla para almacenar las submissions del formulario

-- Eliminar tabla si existe (para reiniciar el lab)
DROP TABLE IF EXISTS submissions;

-- Crear tabla submissions
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    resumen_ia TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_submissions_email ON submissions(email);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_categoria ON submissions(categoria);

-- Comentarios para documentación
COMMENT ON TABLE submissions IS 'Almacena las submissions del formulario web procesadas por n8n';
COMMENT ON COLUMN submissions.id IS 'ID autoincremental único';
COMMENT ON COLUMN submissions.nombre IS 'Nombre del usuario que envió el formulario';
COMMENT ON COLUMN submissions.email IS 'Email del usuario';
COMMENT ON COLUMN submissions.mensaje IS 'Mensaje o consulta del usuario';
COMMENT ON COLUMN submissions.categoria IS 'Tipo de submission: consulta, queja o sugerencia';
COMMENT ON COLUMN submissions.resumen_ia IS 'Resumen generado por Gemini AI';
COMMENT ON COLUMN submissions.created_at IS 'Fecha y hora de creación del registro';

-- Insertar datos de ejemplo para pruebas
INSERT INTO submissions (nombre, email, mensaje, categoria, resumen_ia) VALUES
('Juan Pérez', 'juan.perez@example.com', 'Tengo una consulta sobre el curso de NestJS.', 'consulta', 'Consulta sobre curso NestJS'),
('María García', 'maria.garcia@example.com', 'Excelente material del curso, muy bien explicado.', 'sugerencia', 'Feedback positivo sobre material del curso'),
('Pedro López', 'pedro.lopez@example.com', 'No pude acceder a la plataforma ayer por la tarde.', 'queja', 'Reporte de problema de acceso a plataforma');

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla submissions creada exitosamente con ' || COUNT(*) || ' registros de ejemplo' AS resultado FROM submissions;
