# PadelReserva

App web de reservas de turnos de pádel.

## Tecnologías

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, PostgreSQL (pg)

## Instrucciones de Instalación y Ejecución

### 1. Preparar el Backend (PostgreSQL)

El backend maneja la base de datos y la API.

Requisitos: PostgreSQL instalado y corriendo.
Configura la variable `DATABASE_URL` si es necesario (por defecto: `postgresql://postgres:postgres@localhost:5432/padel_app`).

```bash
# Instalar dependencias (si no se hizo)
npm install

# Iniciar el servidor backend
node server/index.js
```

El servidor correrá en `http://localhost:3000`.
La base de datos y las tablas se crearán automáticamente al iniciar.

### 2. Iniciar el Frontend

En otra terminal:

```bash
npm run dev
```

La aplicación abrirá en `http://localhost:5173`.

### 3. Modo Demo vs Producción

Por defecto, la aplicación frontend arranca en **Modo Demo** (Mock Local) para que puedas probarla sin necesidad de correr el backend.
Para conectar con el backend real:
1. Asegúrate de que `node server/index.js` esté corriendo.
2. En la aplicación web, haz clic en "Cambiar" en el banner superior amarillo.

## Credenciales de Administrador

Para acceder al Panel de Administración:
- Email: `admin@padel.com`
- Password: `admin123`
(Este usuario se crea automáticamente en el primer inicio del servidor).

## Usuarios de Prueba (Mock)

Si usas el modo Mock, puedes registrarte con cualquier email.
(Deberás registrarte primero si usas Mock Local ya que inicia vacío).

## Sistema de Pagos y Expiración

El sistema de reservas incluye un flujo de confirmación de pago con temporizador:
1. **Reserva Provisional**: Al seleccionar un turno, este se reserva temporalmente ("Pending").
2. **Pago**: El usuario tiene **30 minutos** para confirmar el pago (Transferencia o Billetera Virtual).
3. **Expiración**: Si el pago no se confirma en 30 minutos, el turno se libera automáticamente para otros usuarios.

El usuario puede confirmar manualmente haber realizado el pago (Transferencia) o usar el botón de **Mercado Pago**.

## Beneficios y Niveles

- Acumula **100 Puntos** por cada reserva completada.
- Sube de nivel: **Rookie** -> **Amateur** -> **Pro**.
- Visualiza tu progreso en la sección "Mis Reservas".

## Endpoints API (Backend Real)

- `GET /api/courts?city=Necochea`
- `GET /api/bookings`
- `POST /api/auth/login`
- `POST /api/auth/register`
