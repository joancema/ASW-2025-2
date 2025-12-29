-- Stored Procedure para actualizar el resumen de IA
-- Este procedimiento maneja correctamente el escape de caracteres especiales

CREATE OR REPLACE FUNCTION actualizar_resumen_ia(
  p_id INTEGER,
  p_resumen TEXT
) RETURNS TABLE(
  id INTEGER,
  nombre VARCHAR(255),
  email VARCHAR(255),
  mensaje TEXT,
  categoria VARCHAR(50),
  resumen_ia TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  UPDATE submissions
  SET resumen_ia = p_resumen
  WHERE submissions.id = p_id
  RETURNING
    submissions.id,
    submissions.nombre,
    submissions.email,
    submissions.mensaje,
    submissions.categoria,
    submissions.resumen_ia,
    submissions.created_at;
END;
$$ LANGUAGE plpgsql;

-- Comentario explicativo
COMMENT ON FUNCTION actualizar_resumen_ia(INTEGER, TEXT) IS
'Actualiza el campo resumen_ia en la tabla submissions para un ID dado.
Retorna el registro actualizado. Maneja automáticamente el escape de caracteres especiales.';
