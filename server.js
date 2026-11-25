const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kohi-dev-secret-change-me';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kohi.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const findByEmail = db.prepare('SELECT * FROM waitlist WHERE email = ?');
const findById = db.prepare('SELECT id, name, email, position FROM waitlist WHERE id = ?');
const countAll = db.prepare('SELECT COUNT(*) AS total FROM waitlist');
const insertUser = db.prepare(
  `INSERT INTO waitlist (name, email, password_hash, position)
   VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM waitlist))`
);
const getPosition = db.prepare('SELECT position FROM waitlist WHERE id = ?');

// Position calc + insert in one atomic statement/transaction
const register = db.transaction((name, email, hash) => {
  const { lastInsertRowid } = insertUser.run(name, email, hash);
  return getPosition.get(lastInsertRowid).position;
});

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (![name, email, password].every(isNonEmptyString)) {
    return res.status(400).json({ error: 'Faltan campos: name, email y password son obligatorios' });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (findByEmail.get(cleanEmail)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  try {
    const position = register(name.trim(), cleanEmail, bcrypt.hashSync(password, 10));
    res.status(201).json({ success: true, message: 'Registro completado', position });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Faltan campos: email y password son obligatorios' });
  }
  const user = findByEmail.get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

function auth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

app.get('/api/me', auth, (req, res) => {
  const user = findById.get(req.userId);
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  res.json({ ...user, total: countAll.get().total });
});

app.listen(PORT, () => console.log(`Kōhi escuchando en http://localhost:${PORT}`));
