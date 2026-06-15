const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const mysql = require("mysql2/promise");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const TABLE = process.env.DB_TABLE || "reservas";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "reservafacil",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
};

let pool;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("La solicitud es demasiado grande."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("El JSON enviado no es valido."));
      }
    });
  });
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

function normalizeReservation(data) {
  const required = ["cliente", "telefono", "fecha", "hora", "personas", "mesa"];
  const missing = required.filter((field) => !String(data[field] || "").trim());

  if (missing.length) {
    const error = new Error(`Faltan datos: ${missing.join(", ")}.`);
    error.status = 400;
    throw error;
  }

  return {
    cliente: String(data.cliente).trim(),
    telefono: String(data.telefono).trim(),
    fecha: String(data.fecha).trim(),
    hora: String(data.hora).trim(),
    personas: Number(data.personas),
    mesa: String(data.mesa).trim(),
    comentarios: String(data.comentarios || "").trim(),
    restaurante: String(data.restaurante || "La Terraza Gourmet").trim(),
    estado: String(data.estado || "confirmada").trim()
  };
}

function mapReservation(row) {
  return {
    ...row,
    fecha: row.fecha instanceof Date ? row.fecha.toISOString().slice(0, 10) : row.fecha
  };
}

async function listReservations(search = "") {
  const params = {};
  let sql = `select * from ${TABLE}`;

  if (search) {
    sql += " where cliente like :search or telefono like :search";
    params.search = `%${search}%`;
  }

  sql += " order by fecha desc, hora desc";
  const [rows] = await getPool().execute(sql, params);
  return rows.map(mapReservation);
}

async function createReservation(data) {
  const item = normalizeReservation(data);
  const [result] = await getPool().execute(
    `insert into ${TABLE}
      (cliente, telefono, fecha, hora, personas, mesa, comentarios, restaurante, estado)
     values
      (:cliente, :telefono, :fecha, :hora, :personas, :mesa, :comentarios, :restaurante, :estado)`,
    item
  );
  return getReservation(result.insertId);
}

async function getReservation(id) {
  const [rows] = await getPool().execute(`select * from ${TABLE} where id = :id limit 1`, { id });
  if (!rows.length) {
    const error = new Error("Reserva no encontrada.");
    error.status = 404;
    throw error;
  }
  return mapReservation(rows[0]);
}

async function updateReservation(id, data) {
  const item = normalizeReservation(data);
  const [result] = await getPool().execute(
    `update ${TABLE}
     set cliente = :cliente,
         telefono = :telefono,
         fecha = :fecha,
         hora = :hora,
         personas = :personas,
         mesa = :mesa,
         comentarios = :comentarios,
         restaurante = :restaurante,
         estado = :estado
     where id = :id`,
    { ...item, id }
  );

  if (!result.affectedRows) {
    const error = new Error("Reserva no encontrada.");
    error.status = 404;
    throw error;
  }

  return getReservation(id);
}

async function deleteReservation(id) {
  const reservation = await getReservation(id);
  await getPool().execute(`delete from ${TABLE} where id = :id`, { id });
  return reservation;
}

async function handleApi(req, res, url) {
  try {
    const reservationMatch = url.pathname.match(/^\/api\/reservas\/([^/]+)$/);

    if (url.pathname === "/api/health") {
      await getPool().query("select 1");
      sendJson(res, 200, {
        ok: true,
        database: "mysql",
        host: dbConfig.host,
        name: dbConfig.database,
        table: TABLE
      });
      return;
    }

    if (url.pathname === "/api/reservas" && req.method === "GET") {
      sendJson(res, 200, await listReservations(url.searchParams.get("search") || ""));
      return;
    }

    if (url.pathname === "/api/reservas" && req.method === "POST") {
      sendJson(res, 201, await createReservation(await readBody(req)));
      return;
    }

    if (reservationMatch && req.method === "PUT") {
      sendJson(res, 200, await updateReservation(Number(reservationMatch[1]), await readBody(req)));
      return;
    }

    if (reservationMatch && req.method === "DELETE") {
      sendJson(res, 200, await deleteReservation(Number(reservationMatch[1])));
      return;
    }

    sendJson(res, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message });
  }
}

function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Archivo no encontrado.");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }

  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`ReservaFacil listo en http://localhost:${PORT}`);
});
