const pool = require('../db/pool');

// Crear una medición (SIN id_profesor)
exports.createMedicion = async (req, res) => {
  const {
    id_alumno,
    fecha_medicion,
    peso,
    altura,
    cuello,
    cintura,
    cadera,
    usa_balanza,
    grasa_corporal_balanza,
    agua_corporal_balanza,
    masa_muscular_balanza,
    edad,
    sexo,
    notas
  } = req.body;

  try {
    // Calcular IMC
    const alturaMetros = altura / 100;
    const imc = (peso / (alturaMetros * alturaMetros)).toFixed(1);

    // Calcular estimaciones si NO usa balanza
    let grasa_estimada = null;
    let agua_estimada = null;
    let masa_muscular_estimada = null;

    if (!usa_balanza && cuello && cintura) {
      if (sexo === 'M') {
        grasa_estimada = (86.010 * Math.log10(cintura - cuello) - 70.041 * Math.log10(altura) + 36.76).toFixed(1);
      } else if (sexo === 'F' && cadera) {
        grasa_estimada = (163.205 * Math.log10(cintura + cadera - cuello) - 97.684 * Math.log10(altura) - 78.387).toFixed(1);
      }

      if (grasa_estimada !== null) {
        agua_estimada = (60 - (grasa_estimada * 0.5)).toFixed(1);
        masa_muscular_estimada = (100 - grasa_estimada - (100 - grasa_estimada) * 0.15).toFixed(1);
      }
    }

    const result = await pool.query(
      `INSERT INTO mediciones 
        (id_alumno, fecha_medicion, peso, altura, imc, 
         cuello, cintura, cadera, 
         usa_balanza,
         grasa_corporal_balanza, agua_corporal_balanza, masa_muscular_balanza,
         grasa_corporal_estimada, agua_corporal_estimada, masa_muscular_estimada,
         edad, sexo, notas)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) 
        RETURNING *`,
      [
        id_alumno, 
        fecha_medicion, 
        peso, 
        altura, 
        imc,
        cuello || null, 
        cintura || null, 
        cadera || null,
        usa_balanza,
        grasa_corporal_balanza || null,
        agua_corporal_balanza || null,
        masa_muscular_balanza || null,
        grasa_estimada,
        agua_estimada,
        masa_muscular_estimada,
        edad,
        sexo,
        notas || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando medición:', err);
    res.status(500).json({ error: err.message });
  }
};

// Editar medición (SIN id_profesor)
exports.updateMedicion = async (req, res) => {
  const { id } = req.params;
  const {
    id_alumno,
    fecha_medicion,
    peso,
    altura,
    cuello,
    cintura,
    cadera,
    usa_balanza,
    grasa_corporal_balanza,
    agua_corporal_balanza,
    masa_muscular_balanza,
    edad,
    sexo,
    notas
  } = req.body;

  try {
    // Recalcular IMC
    const alturaMetros = altura / 100;
    const imc = (peso / (alturaMetros * alturaMetros)).toFixed(1);

    // Recalcular estimaciones
    let grasa_estimada = null;
    let agua_estimada = null;
    let masa_muscular_estimada = null;

    if (!usa_balanza && cuello && cintura) {
      if (sexo === 'M') {
        grasa_estimada = (86.010 * Math.log10(cintura - cuello) - 70.041 * Math.log10(altura) + 36.76).toFixed(1);
      } else if (sexo === 'F' && cadera) {
        grasa_estimada = (163.205 * Math.log10(cintura + cadera - cuello) - 97.684 * Math.log10(altura) - 78.387).toFixed(1);
      }

      if (grasa_estimada !== null) {
        agua_estimada = (60 - (grasa_estimada * 0.5)).toFixed(1);
        masa_muscular_estimada = (100 - grasa_estimada - (100 - grasa_estimada) * 0.15).toFixed(1);
      }
    }

    const result = await pool.query(
      `UPDATE mediciones SET
        id_alumno=$1,
        fecha_medicion=$2,
        peso=$3,
        altura=$4,
        imc=$5,
        cuello=$6,
        cintura=$7,
        cadera=$8,
        usa_balanza=$9,
        grasa_corporal_balanza=$10,
        agua_corporal_balanza=$11,
        masa_muscular_balanza=$12,
        grasa_corporal_estimada=$13,
        agua_corporal_estimada=$14,
        masa_muscular_estimada=$15,
        edad=$16,
        sexo=$17,
        notas=$18
      WHERE id=$19 RETURNING *`,
      [
        id_alumno,
        fecha_medicion,
        peso,
        altura,
        imc,
        cuello || null,
        cintura || null,
        cadera || null,
        usa_balanza,
        grasa_corporal_balanza || null,
        agua_corporal_balanza || null,
        masa_muscular_balanza || null,
        grasa_estimada,
        agua_estimada,
        masa_muscular_estimada,
        edad,
        sexo,
        notas || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medición no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando medición:', err);
    res.status(500).json({ error: err.message });
  }
};

// Resto de funciones igual...
exports.getMedicionesByAlumno = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM mediciones WHERE id_alumno = $1 ORDER BY fecha_medicion DESC',
      [id_alumno]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo mediciones:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMedicionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM mediciones WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medición no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo medición:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMedicion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM mediciones WHERE id=$1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medición no encontrada' });
    }

    res.json({ 
      mensaje: 'Medición eliminada correctamente', 
      medicion: result.rows[0] 
    });
  } catch (err) {
    console.error('Error eliminando medición:', err);
    res.status(500).json({ error: err.message });
  }
};
