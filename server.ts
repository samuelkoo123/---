import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite for local development / preview environment
const dbPath = path.join(__dirname, "cfs_dev.sqlite");
const db = new Database(dbPath);

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS churches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    churchId INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    birthDate TEXT DEFAULT '',
    registrationDate TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (churchId) REFERENCES churches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS offerings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    churchId INTEGER NOT NULL,
    memberId INTEGER,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (churchId) REFERENCES churches(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    churchId INTEGER NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL DEFAULT 0,
    date TEXT NOT NULL,
    description TEXT DEFAULT '',
    memberId INTEGER,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (churchId) REFERENCES churches(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE SET NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Prevent caching of sensitive data
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: "sqlite_dev", time: new Date().toISOString() });
  });

  // Admin Login
  const ADMIN_PASSWORD = "hepsiba1234";
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password && password.trim() === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "관리자 비밀번호가 틀립니다." });
    }
  });

  // Churches
  app.get("/api/churches", (req, res) => {
    try {
      const rows = db.prepare("SELECT id, name, createdAt FROM churches ORDER BY name ASC").all();
      res.json(rows.map((r: any) => ({ ...r, id: String(r.id) })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/churches", async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) return res.status(400).json({ error: "이름과 비밀번호를 입력해주세요." });

    try {
      const existing = db.prepare("SELECT id FROM churches WHERE name = ?").get(name);
      if (existing) return res.status(400).json({ error: "이미 존재하는 교회 이름입니다." });

      const hash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const info = db.prepare("INSERT INTO churches (name, password, createdAt) VALUES (?, ?, ?)").run(name, hash, now);
      res.json({ id: String(info.lastInsertRowid), name, createdAt: now });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/churches/:id", async (req, res) => {
    const { id } = req.params;
    const { name, password } = req.body;

    try {
      if (name && password) {
        const hash = await bcrypt.hash(password, 10);
        db.prepare("UPDATE churches SET name = ?, password = ? WHERE id = ?").run(name, hash, id);
      } else if (name) {
        db.prepare("UPDATE churches SET name = ? WHERE id = ?").run(name, id);
      } else if (password) {
        const hash = await bcrypt.hash(password, 10);
        db.prepare("UPDATE churches SET password = ? WHERE id = ?").run(hash, id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/churches/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM churches WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/churches/login", async (req, res) => {
    const { name, password } = req.body;
    try {
      const church: any = db.prepare("SELECT * FROM churches WHERE name = ?").get(name);
      if (!church) return res.status(401).json({ error: "교회 이름 또는 비밀번호가 일치하지 않습니다." });

      const match = await bcrypt.compare(password, church.password);
      if (!match) return res.status(401).json({ error: "교회 이름 또는 비밀번호가 일치하지 않습니다." });

      res.json({ id: String(church.id), name: church.name, createdAt: church.createdAt });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Members
  app.get("/api/members", (req, res) => {
    const { churchId } = req.query;
    if (!churchId) return res.status(400).json({ error: "churchId is required" });

    try {
      const rows = db.prepare("SELECT * FROM members WHERE churchId = ? ORDER BY name ASC").all(churchId);
      res.json(rows.map((r: any) => ({ ...r, id: String(r.id) })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/members", (req, res) => {
    const { churchId, name, phone, address, birthDate, registrationDate } = req.body;
    if (!churchId || !name) return res.status(400).json({ error: "churchId and name are required" });

    try {
      const reg = registrationDate || new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      const info = db.prepare(
        "INSERT INTO members (churchId, name, phone, address, birthDate, registrationDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(churchId, name, phone || "", address || "", birthDate || "", reg, now);

      res.json({ id: String(info.lastInsertRowid), success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/members/:id", (req, res) => {
    const { id } = req.params;
    const { name, phone, address, birthDate, registrationDate } = req.body;

    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (name !== undefined) { updates.push("name = ?"); values.push(name); }
      if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
      if (address !== undefined) { updates.push("address = ?"); values.push(address); }
      if (birthDate !== undefined) { updates.push("birthDate = ?"); values.push(birthDate); }
      if (registrationDate !== undefined) { updates.push("registrationDate = ?"); values.push(registrationDate); }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/members/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM members WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Offerings
  app.get("/api/offerings", (req, res) => {
    const { churchId } = req.query;
    if (!churchId) return res.status(400).json({ error: "churchId is required" });

    try {
      const rows = db.prepare(`
        SELECT o.*, m.name as memberName 
        FROM offerings o
        LEFT JOIN members m ON o.memberId = m.id
        WHERE o.churchId = ?
        ORDER BY o.date DESC, o.id DESC
      `).all(churchId);

      res.json(rows.map((r: any) => ({
        ...r,
        id: String(r.id),
        churchId: String(r.churchId),
        memberId: r.memberId ? String(r.memberId) : "",
        memberName: r.memberName || "미지정",
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
      })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/offerings", (req, res) => {
    const { churchId, memberId, type, amount, date, notes } = req.body;
    if (!churchId || !type) return res.status(400).json({ error: "churchId and type are required" });

    try {
      const now = new Date().toISOString();
      const mId = memberId ? Number(memberId) : null;
      const info = db.prepare(
        "INSERT INTO offerings (churchId, memberId, type, amount, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(churchId, mId, type, Number(amount || 0), date || new Date().toISOString().split("T")[0], notes || "", now);

      res.json({ id: String(info.lastInsertRowid), success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/offerings/:id", (req, res) => {
    const { id } = req.params;
    const { memberId, type, amount, date, notes } = req.body;

    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (memberId !== undefined) { updates.push("memberId = ?"); values.push(memberId ? Number(memberId) : null); }
      if (type !== undefined) { updates.push("type = ?"); values.push(type); }
      if (amount !== undefined) { updates.push("amount = ?"); values.push(Number(amount)); }
      if (date !== undefined) { updates.push("date = ?"); values.push(date); }
      if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE offerings SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/offerings/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM offerings WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    const { churchId } = req.query;
    if (!churchId) return res.status(400).json({ error: "churchId is required" });

    try {
      const rows = db.prepare(`
        SELECT t.*, m.name as memberName 
        FROM transactions t
        LEFT JOIN members m ON t.memberId = m.id
        WHERE t.churchId = ?
        ORDER BY t.date DESC, t.id DESC
      `).all(churchId);

      res.json(rows.map((r: any) => ({
        ...r,
        id: String(r.id),
        churchId: String(r.churchId),
        memberId: r.memberId ? String(r.memberId) : undefined,
        memberName: r.memberName || undefined,
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now()
      })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { churchId, type, category, amount, date, description, memberId } = req.body;
    if (!churchId || !category) return res.status(400).json({ error: "churchId and category are required" });

    try {
      const now = new Date().toISOString();
      const mId = memberId ? Number(memberId) : null;
      const info = db.prepare(
        "INSERT INTO transactions (churchId, type, category, amount, date, description, memberId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(churchId, type || "income", category, Number(amount || 0), date || new Date().toISOString().split("T")[0], description || "", mId, now);

      res.json({ id: String(info.lastInsertRowid), success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date, description, memberId } = req.body;

    try {
      const updates: string[] = [];
      const values: any[] = [];
      if (type !== undefined) { updates.push("type = ?"); values.push(type); }
      if (category !== undefined) { updates.push("category = ?"); values.push(category); }
      if (amount !== undefined) { updates.push("amount = ?"); values.push(Number(amount)); }
      if (date !== undefined) { updates.push("date = ?"); values.push(date); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (memberId !== undefined) { updates.push("memberId = ?"); values.push(memberId ? Number(memberId) : null); }

      if (updates.length > 0) {
        values.push(id);
        db.prepare(`UPDATE transactions SET ${updates.join(", ")} WHERE id = ?`).run(...values);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Restore Bulk
  app.post("/api/restore", (req, res) => {
    const { churchId, type, data } = req.body;
    if (!churchId || !type || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid restore payload" });
    }

    try {
      const now = new Date().toISOString();
      const insertTransaction = db.transaction(() => {
        if (type === "members") {
          const stmt = db.prepare("INSERT INTO members (churchId, name, phone, address, birthDate, registrationDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
          for (const item of data) {
            stmt.run(churchId, item.name || "", item.phone || "", item.address || "", item.birthDate || "", item.registrationDate || new Date().toISOString().split("T")[0], now);
          }
        } else if (type === "offerings") {
          const stmt = db.prepare("INSERT INTO offerings (churchId, memberId, type, amount, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
          for (const item of data) {
            stmt.run(churchId, item.memberId ? Number(item.memberId) : null, item.type || "", Number(item.amount || 0), item.date || new Date().toISOString().split("T")[0], item.notes || "", now);
          }
        } else if (type === "transactions") {
          const stmt = db.prepare("INSERT INTO transactions (churchId, type, category, amount, date, description, memberId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          for (const item of data) {
            stmt.run(churchId, item.type || "income", item.category || "", Number(item.amount || 0), item.date || new Date().toISOString().split("T")[0], item.description || "", item.memberId ? Number(item.memberId) : null, now);
          }
        }
      });

      insertTransaction();
      res.json({ success: true, count: data.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
