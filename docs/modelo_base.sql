-- Tabla de profesores (clientes/usuarios de pago)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE,        -- DNI/cédula nacional, ÚNICO por plataforma
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasenia VARCHAR(256) NOT NULL, -- Hash seguro
    fecha_registro TIMESTAMP DEFAULT NOW(),
    fecha_inicio_prueba TIMESTAMP DEFAULT NOW(),
    fecha_fin_prueba TIMESTAMP,
    fecha_ultimo_pago TIMESTAMP,
    estado_suscripcion VARCHAR(15) DEFAULT 'prueba', -- prueba, activa, vencida, bloqueada
    cliente_activo BOOLEAN DEFAULT true,
    notas TEXT
);

-- Tabla de alumnos (dependen de un cliente/profesor)
CREATE TABLE alumnos (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    dni VARCHAR(20),                                -- DNI del alumno (puede repetirse en distintos clientes)
    nombre VARCHAR(100) NOT NULL,
    sexo VARCHAR(10),
    fecha_nacimiento DATE,
    contacto VARCHAR(130),
    notas TEXT,
    UNIQUE(id_cliente, dni)                         -- Evita dos alumnos con mismo DNI bajo un mismo cliente
);

-- Tabla de mediciones corporales
CREATE TABLE mediciones (
    id SERIAL PRIMARY KEY,
    id_alumno INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL,
    peso NUMERIC(5,2),
    altura NUMERIC(5,2),
    cintura NUMERIC(5,2),
    cadera NUMERIC(5,2),
    brazo NUMERIC(5,2),
    pierna NUMERIC(5,2),
    grasa_corporal NUMERIC(5,2),
    imc NUMERIC(5,2),
    balanza_manual BOOLEAN DEFAULT true,
    notas TEXT
);

-- Tabla para pagos del profesor a la plataforma (suscripciones)
CREATE TABLE pagos_suscripciones (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(15),                       -- activa, vencida, pendiente, etc
    monto NUMERIC(10,2),
    metodo_pago VARCHAR(30),
    comprobante TEXT,
    notas TEXT
);

-- Tabla para pagos del alumno al profesor (registro administrativo)
CREATE TABLE pagos_alumnos (
    id SERIAL PRIMARY KEY,
    id_alumno INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    id_profesor INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_pago TIMESTAMP NOT NULL,
    periodo_desde DATE,
    periodo_hasta DATE,
    monto NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(30),
    observaciones TEXT,
    UNIQUE(id_alumno, periodo_desde, periodo_hasta)
);

