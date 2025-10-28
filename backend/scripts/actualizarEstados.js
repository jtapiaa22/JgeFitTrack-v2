const pool = require('../db/pool');

async function actualizarEstadosSuscripciones() {
  try {
    // Actualizar suscripciones vencidas
    const result = await pool.query(
      `UPDATE pagos_suscripciones 
       SET estado = 'vencida' 
       WHERE fecha_fin < CURRENT_DATE 
       AND estado = 'activa'
       RETURNING id`
    );
    
    console.log(`✅ ${result.rowCount} suscripciones actualizadas a "vencida"`);
    
    // Desactivar profesores con suscripciones vencidas y sin período de prueba
    const profResult = await pool.query(
      `UPDATE clientes 
       SET activo = false 
       WHERE rol = 'profesor' 
       AND activo = true 
       AND en_prueba = false
       AND id NOT IN (
         SELECT id_cliente 
         FROM pagos_suscripciones 
         WHERE estado = 'activa' 
         AND fecha_fin >= CURRENT_DATE
       )
       RETURNING id`
    );
    
    console.log(`✅ ${profResult.rowCount} profesores desactivados por falta de suscripción`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando estados:', error);
    process.exit(1);
  }
}

actualizarEstadosSuscripciones();
