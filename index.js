import { SignJWT, jwtVerify } from 'jose';

// Fetch key from environment variables (fallback ONLY for local dev wrangler)
const getSecret = (env) => new TextEncoder().encode(env.JWT_SECRET || "your-local-dev-secret-key-change-this");

// Secure hashing utility using native WebCrypto API
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const SECRET = getSecret(env);

      // --- AUTH ROUTING ---
      if (url.pathname === "/api/register" && method === "POST") {
        const { username, password } = await request.json();
        const userId = crypto.randomUUID();
        
        // Securely hash password
        const passwordHash = await hashPassword(password);
        
        await env.DB.prepare("INSERT INTO users (id, username, password_hash, settings) VALUES (?, ?, ?, ?)")
          .bind(userId, username, passwordHash, JSON.stringify({ hsk: [1], showPinyin: true })).run();
        
        const token = await new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).sign(SECRET);
        return new Response(JSON.stringify({ token }), { headers: corsHeaders });
      }

      if (url.pathname === "/api/login" && method === "POST") {
        const { username, password } = await request.json();
        const passwordHash = await hashPassword(password);

        const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password_hash = ?")
          .bind(username, passwordHash).first();
        if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        
        const token = await new SignJWT({ userId: user.id }).setProtectedHeader({ alg: 'HS256' }).sign(SECRET);
        return new Response(JSON.stringify({ token, settings: JSON.parse(user.settings) }), { headers: corsHeaders });
      }

      // --- PROTECTED ROUTE SHIELD ---
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Missing Auth", { status: 401, headers: corsHeaders });
      }
      const token = authHeader.split(" ")[1];
      const { payload } = await jwtVerify(token, SECRET);
      const userId = payload.userId;

      // --- OPTIMIZED BATCH SYNC ---
      if (url.pathname === "/api/sync" && method === "POST") {
        const { progress, settings } = await request.json();
        
        // Save settings
        const statements = [
          env.DB.prepare("UPDATE users SET settings = ? WHERE id = ?").bind(JSON.stringify(settings), userId)
        ];
        
        // Push progress queries to prepare batch execution
        const progressStmt = env.DB.prepare(`
          INSERT INTO progress (user_id, char_id, ease_factor, repetition, interval, next_review, dont_know_count, correct_count, incorrect_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, char_id) DO UPDATE SET
            ease_factor=excluded.ease_factor, repetition=excluded.repetition, interval=excluded.interval,
            next_review=excluded.next_review, dont_know_count=excluded.dont_know_count, 
            correct_count=excluded.correct_count, incorrect_count=excluded.incorrect_count
        `);

        for (const item of progress) {
          statements.push(progressStmt.bind(
            userId, item.char_id, item.ease_factor, item.repetition, item.interval, 
            item.next_review, item.dont_know_count, item.correct_count, item.incorrect_count
          ));
        }
        
        // Execute everything inside a single, fast SQL transaction context
        await env.DB.batch(statements);
        
        // Fetch complete updated cloud records
        const cloudProgress = await env.DB.prepare("SELECT * FROM progress WHERE user_id = ?").bind(userId).all();
        return new Response(JSON.stringify({ success: true, progress: cloudProgress.results }), { headers: corsHeaders });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};

