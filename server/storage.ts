import { pool } from "./db";
import type {
  User, InsertUser, FavoriteRoute, PriceAlert, CreateAlertInput, WaitlistEntry,
  CommunityPost, InsertCommunityPost, CommunityDestination, CommunityCity,
  CommunityPostTranslation, CommunityReport, CommunityComment, AdminUser,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  verifyUserEmail(token: string): Promise<User | undefined>;
  adminListUsers(): Promise<AdminUser[]>;

  // Favorite routes
  getFavoriteRoutes(userId: number): Promise<FavoriteRoute[]>;
  addFavoriteRoute(userId: number, origin: string, destination: string, originLabel?: string, destinationLabel?: string): Promise<FavoriteRoute>;
  removeFavoriteRoute(userId: number, routeId: number): Promise<void>;

  // Price alerts
  getPriceAlerts(userId: number): Promise<PriceAlert[]>;
  getAllActiveAlerts(): Promise<(PriceAlert & { userEmail: string; userName: string | null })[]>;
  createPriceAlert(userId: number, data: CreateAlertInput): Promise<PriceAlert>;
  deactivatePriceAlert(userId: number, alertId: number): Promise<void>;
  markAlertSent(alertId: number): Promise<void>;

  // Waitlist
  addWaitlistEntry(email: string, service: string): Promise<void>;

  // Visa feedback
  addVisaFeedback(countryPair: string, issue: string, correctInfo: string, email: string): Promise<void>;

  // Route price history
  recordRoutePrice(origin: string, destination: string, departureDate: string, cabinClass: string, price: number, currency: string): Promise<void>;
  getRouteStats(origin: string, destination: string, departureDate: string, cabinClass: string): Promise<RouteStats>;
  trackInsightEvent(eventType: string, origin?: string, destination?: string, departureDate?: string, savingsPct?: number, savingsAmount?: number, currency?: string, userId?: number): Promise<void>;
  getTopInsightRoutes(limit?: number): Promise<{ origin: string; destination: string; eventType: string; count: number; avgSavingsPct: number }[]>;

  // Community
  initCommunityTables(): Promise<void>;
  createCommunityPost(userId: number, authorName: string, data: InsertCommunityPost, originalLang: string): Promise<CommunityPost>;
  updateCommunityPost(id: number, data: InsertCommunityPost): Promise<CommunityPost | undefined>;
  getCommunityFeed(opts: { type?: string; category?: string; countryCode?: string; city?: string; beforeId?: number; offset?: number; limit?: number; sort?: string; userId?: number }): Promise<CommunityPost[]>;
  getCommunityPost(id: number, userId?: number): Promise<CommunityPost | undefined>;
  toggleCommunityLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }>;
  getUserCommunityPosts(userId: number): Promise<CommunityPost[]>;
  deleteCommunityPost(id: number, userId: number): Promise<boolean>;
  listCommunityDestinations(): Promise<CommunityDestination[]>;
  listCommunityCities(countryCode: string): Promise<CommunityCity[]>;
  reportCommunityPost(postId: number, userId: number, reason: string): Promise<void>;
  getCommunityTranslation(postId: number, lang: string): Promise<CommunityPostTranslation | undefined>;
  saveCommunityTranslation(postId: number, lang: string, payload: CommunityPostTranslation): Promise<void>;
  adminListCommunityReports(): Promise<CommunityReport[]>;
  adminRemoveCommunityPost(id: number): Promise<boolean>;
  listCommunityComments(postId: number): Promise<CommunityComment[]>;
  createCommunityComment(postId: number, userId: number, authorName: string, body: string): Promise<CommunityComment>;
  deleteCommunityComment(id: number, userId: number, isAdmin: boolean): Promise<boolean>;
}

export type RouteStats = {
  avgPrice: number | null;
  minPrice: number | null;
  dataPoints: number;
  prediction: "buy_now" | "wait" | null;
  trend: { date: string; avgPrice: number }[];
};

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    homeAirport: row.home_airport ?? null,
    homeAirportLabel: row.home_airport_label ?? null,
    googleId: row.google_id ?? null,
    emailVerified: row.email_verified ?? false,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

function rowToAlert(row: any): PriceAlert {
  return {
    id: row.id,
    userId: row.user_id,
    origin: row.origin,
    destination: row.destination,
    departureDate: row.departure_date,
    returnDate: row.return_date ?? null,
    cabinClass: row.cabin_class,
    passengersAdult: row.passengers_adult,
    baselinePrice: parseFloat(row.baseline_price),
    currency: row.currency,
    isActive: row.is_active,
    lastAlertedAt: row.last_alerted_at?.toISOString?.() ?? row.last_alerted_at ?? null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

function rowToCommunityPost(row: any): CommunityPost {
  const parse = (v: any, fallback: any) => {
    if (v == null) return fallback;
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return fallback; } }
    return v;
  };
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name ?? "Traveler",
    type: row.type === "recommendation" ? "recommendation" : row.type === "visa_experience" ? "visa_experience" : "story",
    title: row.title,
    story: row.story ?? "",
    countryCode: row.country_code,
    countryName: row.country_name,
    city: row.city ?? null,
    category: row.category ?? null,
    rating: row.rating ?? null,
    visaOutcome: row.visa_outcome ?? null,
    processingTimeReported: row.processing_time_reported ?? null,
    photos: parse(row.photos, []) as string[],
    originalLang: row.original_lang ?? "en",
    status: row.status ?? "active",
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    likedByMe: row.liked_by_me === true,
  };
}

function rowToCommunityComment(row: any): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name ?? "Traveler",
    body: row.body,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export class PgStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | undefined> {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!rows[0]) return undefined;
    return { ...rowToUser(rows[0]), passwordHash: rows[0].password_hash ?? undefined };
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const { rows } = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()",
      [token]
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, home_airport, home_airport_label, google_id, email_verified, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        user.email,
        user.passwordHash ?? null,
        user.name ?? null,
        user.homeAirport ?? null,
        user.homeAirportLabel ?? null,
        user.googleId ?? null,
        user.emailVerified ?? (user.googleId ? true : false),
        user.verificationToken ?? null,
        user.verificationTokenExpires ?? null,
      ]
    );
    return rowToUser(rows[0]);
  }

  async verifyUserEmail(token: string): Promise<User | undefined> {
    const { rows } = await pool.query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
       WHERE verification_token = $1 AND verification_token_expires > NOW() RETURNING *`,
      [token]
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (updates.name !== undefined) { fields.push(`name = $${i++}`); values.push(updates.name); }
    if (updates.homeAirport !== undefined) { fields.push(`home_airport = $${i++}`); values.push(updates.homeAirport); }
    if (updates.homeAirportLabel !== undefined) { fields.push(`home_airport_label = $${i++}`); values.push(updates.homeAirportLabel); }
    if (updates.googleId !== undefined) { fields.push(`google_id = $${i++}`); values.push(updates.googleId); }
    if (updates.emailVerified !== undefined) { fields.push(`email_verified = $${i++}`); values.push(updates.emailVerified); }
    if (updates.verificationToken !== undefined) { fields.push(`verification_token = $${i++}`); values.push(updates.verificationToken); }
    if (updates.verificationTokenExpires !== undefined) { fields.push(`verification_token_expires = $${i++}`); values.push(updates.verificationTokenExpires); }
    if (fields.length === 0) return this.getUserById(id);
    values.push(id);
    const { rows } = await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async adminListUsers(): Promise<AdminUser[]> {
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.email,
         u.name,
         u.email_verified,
         u.google_id,
         u.created_at,
         (SELECT COUNT(*) FROM community_posts    p WHERE p.user_id = u.id AND p.status <> 'removed')::int AS post_count,
         (SELECT COUNT(*) FROM community_comments c WHERE c.user_id = u.id)::int AS comment_count,
         (SELECT COUNT(*) FROM community_reports  r WHERE r.user_id = u.id)::int AS report_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name ?? null,
      emailVerified: !!r.email_verified,
      hasGoogle: !!r.google_id,
      createdAt: r.created_at?.toISOString?.() ?? r.created_at,
      postCount: r.post_count ?? 0,
      commentCount: r.comment_count ?? 0,
      reportCount: r.report_count ?? 0,
    }));
  }

  async getFavoriteRoutes(userId: number): Promise<FavoriteRoute[]> {
    const { rows } = await pool.query(
      "SELECT * FROM favorite_routes WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      origin: r.origin,
      destination: r.destination,
      originLabel: r.origin_label ?? null,
      destinationLabel: r.destination_label ?? null,
      createdAt: r.created_at?.toISOString?.() ?? r.created_at,
    }));
  }

  async addFavoriteRoute(userId: number, origin: string, destination: string, originLabel?: string, destinationLabel?: string): Promise<FavoriteRoute> {
    const { rows } = await pool.query(
      `INSERT INTO favorite_routes (user_id, origin, destination, origin_label, destination_label)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, origin, destination) DO UPDATE SET origin_label = $4, destination_label = $5
       RETURNING *`,
      [userId, origin, destination, originLabel ?? null, destinationLabel ?? null]
    );
    const r = rows[0];
    return { id: r.id, userId: r.user_id, origin: r.origin, destination: r.destination, originLabel: r.origin_label ?? null, destinationLabel: r.destination_label ?? null, createdAt: r.created_at?.toISOString?.() ?? r.created_at };
  }

  async removeFavoriteRoute(userId: number, routeId: number): Promise<void> {
    await pool.query("DELETE FROM favorite_routes WHERE id = $1 AND user_id = $2", [routeId, userId]);
  }

  async getPriceAlerts(userId: number): Promise<PriceAlert[]> {
    const { rows } = await pool.query(
      "SELECT * FROM price_alerts WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC",
      [userId]
    );
    return rows.map(rowToAlert);
  }

  async getAllActiveAlerts(): Promise<(PriceAlert & { userEmail: string; userName: string | null; userEmailVerified: boolean })[]> {
    const { rows } = await pool.query(
      `SELECT pa.*, u.email AS user_email, u.name AS user_name, u.email_verified AS user_email_verified
       FROM price_alerts pa JOIN users u ON pa.user_id = u.id
       WHERE pa.is_active = TRUE AND pa.departure_date >= CURRENT_DATE::text`
    );
    return rows.map((r) => ({
      ...rowToAlert(r),
      userEmail: r.user_email,
      userName: r.user_name ?? null,
      userEmailVerified: r.user_email_verified ?? false,
    }));
  }

  async createPriceAlert(userId: number, data: CreateAlertInput): Promise<PriceAlert> {
    const { rows } = await pool.query(
      `INSERT INTO price_alerts (user_id, origin, destination, departure_date, return_date, cabin_class, passengers_adult, baseline_price, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, data.origin, data.destination, data.departureDate, data.returnDate ?? null, data.cabinClass, data.passengersAdult, data.baselinePrice, data.currency]
    );
    return rowToAlert(rows[0]);
  }

  async deactivatePriceAlert(userId: number, alertId: number): Promise<void> {
    await pool.query("UPDATE price_alerts SET is_active = FALSE WHERE id = $1 AND user_id = $2", [alertId, userId]);
  }

  async markAlertSent(alertId: number): Promise<void> {
    await pool.query("UPDATE price_alerts SET last_alerted_at = NOW() WHERE id = $1", [alertId]);
  }

  async recordRoutePrice(origin: string, destination: string, departureDate: string, cabinClass: string, price: number, currency: string): Promise<void> {
    await pool.query(
      `INSERT INTO route_price_history (origin, destination, departure_date, cabin_class, price, currency)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [origin, destination, departureDate, cabinClass, price, currency]
    );
  }

  async getRouteStats(origin: string, destination: string, departureDate: string, cabinClass: string): Promise<RouteStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { rows: statsRows } = await pool.query(
      `SELECT AVG(price)::float AS avg_price, MIN(price)::float AS min_price, COUNT(*) AS data_points
       FROM route_price_history
       WHERE origin = $1 AND destination = $2 AND departure_date = $3 AND cabin_class = $4
         AND recorded_at >= $5`,
      [origin, destination, departureDate, cabinClass, thirtyDaysAgo]
    );

    const { rows: trendRows } = await pool.query(
      `SELECT DATE(recorded_at) AS day, AVG(price)::float AS avg_price
       FROM route_price_history
       WHERE origin = $1 AND destination = $2 AND departure_date = $3 AND cabin_class = $4
         AND recorded_at >= $5
       GROUP BY DATE(recorded_at)
       ORDER BY day ASC`,
      [origin, destination, departureDate, cabinClass, sevenDaysAgo]
    );

    const avgPrice = statsRows[0]?.avg_price ?? null;
    const minPrice = statsRows[0]?.min_price ?? null;
    const dataPoints = parseInt(statsRows[0]?.data_points ?? "0", 10);
    const trend = trendRows.map((r) => ({ date: r.day, avgPrice: parseFloat(r.avg_price) }));

    return { avgPrice, minPrice, dataPoints, prediction: null, trend };
  }

  async trackInsightEvent(
    eventType: string,
    origin?: string,
    destination?: string,
    departureDate?: string,
    savingsPct?: number,
    savingsAmount?: number,
    currency?: string,
    userId?: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO insight_events (event_type, origin, destination, departure_date, savings_pct, savings_amount, currency, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [eventType, origin ?? null, destination ?? null, departureDate ?? null, savingsPct ?? null, savingsAmount ?? null, currency ?? null, userId ?? null]
    );
  }

  async getTopInsightRoutes(limit = 20): Promise<{ origin: string; destination: string; eventType: string; count: number; avgSavingsPct: number }[]> {
    const { rows } = await pool.query(
      `SELECT origin, destination, event_type AS "eventType",
              COUNT(*)::int AS count,
              ROUND(AVG(savings_pct)::numeric, 1)::float AS "avgSavingsPct"
       FROM insight_events
       WHERE origin IS NOT NULL AND destination IS NOT NULL
       GROUP BY origin, destination, event_type
       ORDER BY count DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }
  async addWaitlistEntry(email: string, service: string): Promise<void> {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS waitlist_entries (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        service TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (email, service)
      )`
    );
    await pool.query(
      `INSERT INTO waitlist_entries (email, service) VALUES ($1, $2)
       ON CONFLICT (email, service) DO NOTHING`,
      [email.toLowerCase().trim(), service]
    );
  }

  async addVisaFeedback(countryPair: string, issue: string, correctInfo: string, email: string): Promise<void> {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS visa_feedback (
        id SERIAL PRIMARY KEY,
        country_pair TEXT NOT NULL,
        issue TEXT NOT NULL,
        correct_info TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    await pool.query(
      `INSERT INTO visa_feedback (country_pair, issue, correct_info, email) VALUES ($1, $2, $3, $4)`,
      [countryPair.trim(), issue.trim(), correctInfo.trim(), email?.trim() || null]
    );
  }

  // ── Community ───────────────────────────────────────────────────────────────
  async initCommunityTables(): Promise<void> {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Traveler',
        type TEXT NOT NULL DEFAULT 'story',
        title TEXT NOT NULL,
        story TEXT NOT NULL DEFAULT '',
        country_code TEXT NOT NULL,
        country_name TEXT NOT NULL,
        city TEXT,
        category TEXT,
        rating INTEGER,
        recommendations JSONB NOT NULL DEFAULT '[]',
        photos JSONB NOT NULL DEFAULT '[]',
        original_lang TEXT NOT NULL DEFAULT 'en',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    // Backfill columns for tables created before the type/category/rating model.
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'story'`);
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category TEXT`);
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS rating INTEGER`);
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS visa_outcome TEXT`);
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS processing_time_reported TEXT`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_posts_country ON community_posts (country_code)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_posts_status_id ON community_posts (status, id DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts (type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts (category)`);

    await pool.query(
      `CREATE TABLE IF NOT EXISTS community_post_translations (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        lang TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (post_id, lang)
      )`
    );

    await pool.query(
      `CREATE TABLE IF NOT EXISTS community_reports (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (post_id, user_id)
      )`
    );

    await pool.query(
      `CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Traveler',
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments (post_id, id DESC)`);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS community_post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (post_id, user_id)
      )`
    );
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON community_post_likes (post_id)`);
  }

  async createCommunityPost(userId: number, authorName: string, data: InsertCommunityPost, originalLang: string): Promise<CommunityPost> {
    const isRec = data.type === "recommendation";
    const isVisa = data.type === "visa_experience";
    const { rows } = await pool.query(
      `INSERT INTO community_posts
        (user_id, author_name, type, title, story, country_code, country_name, city, category, rating, visa_outcome, processing_time_reported, photos, original_lang)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)
       RETURNING *`,
      [
        userId,
        authorName,
        data.type,
        data.title.trim(),
        (data.story ?? "").trim(),
        data.countryCode.toUpperCase(),
        data.countryName.trim(),
        data.city?.trim() || null,
        isRec ? data.category : null,
        isRec ? data.rating ?? null : null,
        isVisa ? data.visaOutcome ?? null : null,
        isVisa ? data.processingTimeReported?.trim() || null : null,
        JSON.stringify(data.photos ?? []),
        originalLang,
      ]
    );
    return rowToCommunityPost(rows[0]);
  }

  async updateCommunityPost(id: number, data: InsertCommunityPost): Promise<CommunityPost | undefined> {
    const isRec = data.type === "recommendation";
    const isVisa = data.type === "visa_experience";
    const { rows } = await pool.query(
      `UPDATE community_posts SET
         type = $2, title = $3, story = $4, country_code = $5, country_name = $6,
         city = $7, category = $8, rating = $9, visa_outcome = $10, processing_time_reported = $11, photos = $12::jsonb
       WHERE id = $1 AND status <> 'removed'
       RETURNING *`,
      [
        id,
        data.type,
        data.title.trim(),
        (data.story ?? "").trim(),
        data.countryCode.toUpperCase(),
        data.countryName.trim(),
        data.city?.trim() || null,
        isRec ? data.category : null,
        isRec ? data.rating ?? null : null,
        isVisa ? data.visaOutcome ?? null : null,
        isVisa ? data.processingTimeReported?.trim() || null : null,
        JSON.stringify(data.photos ?? []),
      ]
    );
    return rows[0] ? rowToCommunityPost(rows[0]) : undefined;
  }

  async getCommunityFeed(opts: { type?: string; category?: string; countryCode?: string; city?: string; beforeId?: number; offset?: number; limit?: number; sort?: string; userId?: number }): Promise<CommunityPost[]> {
    const where: string[] = ["p.status = 'active'"];
    const params: any[] = [];
    let userParam = "NULL";
    if (opts.userId != null) { params.push(opts.userId); userParam = `$${params.length}`; }
    if (opts.type) { params.push(opts.type); where.push(`p.type = $${params.length}`); }
    if (opts.category) { params.push(opts.category); where.push(`p.category = $${params.length}`); }
    if (opts.countryCode) { params.push(opts.countryCode.toUpperCase()); where.push(`p.country_code = $${params.length}`); }
    if (opts.city) { params.push(opts.city.trim().toLowerCase()); where.push(`LOWER(p.city) = $${params.length}`); }
    const popular = opts.sort === "popular";
    if (!popular && opts.beforeId) { params.push(opts.beforeId); where.push(`p.id < $${params.length}`); }
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    params.push(limit);
    const limitParam = `$${params.length}`;
    let tail: string;
    if (popular) {
      const offset = Math.max(opts.offset ?? 0, 0);
      params.push(offset);
      tail = `ORDER BY score DESC, p.id DESC LIMIT ${limitParam} OFFSET $${params.length}`;
    } else {
      tail = `ORDER BY p.id DESC LIMIT ${limitParam}`;
    }
    const { rows } = await pool.query(
      `SELECT p.*,
         (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id)::int AS like_count,
         (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id)::int AS comment_count,
         ((SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id)
            + (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id)) AS score,
         CASE WHEN ${userParam}::int IS NULL THEN false
              ELSE EXISTS(SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = ${userParam}) END AS liked_by_me
       FROM community_posts p
       WHERE ${where.join(" AND ")}
       ${tail}`,
      params
    );
    return rows.map(rowToCommunityPost);
  }

  async getCommunityPost(id: number, userId?: number): Promise<CommunityPost | undefined> {
    const userParam = userId != null ? "$2" : "NULL";
    const params: any[] = userId != null ? [id, userId] : [id];
    const { rows } = await pool.query(
      `SELECT p.*,
         (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id)::int AS like_count,
         (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id)::int AS comment_count,
         CASE WHEN ${userParam}::int IS NULL THEN false
              ELSE EXISTS(SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = ${userParam}) END AS liked_by_me
       FROM community_posts p WHERE p.id = $1`,
      params
    );
    return rows[0] ? rowToCommunityPost(rows[0]) : undefined;
  }

  async toggleCommunityLike(postId: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    const del = await pool.query(
      "DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId]
    );
    let liked: boolean;
    if (del.rowCount && del.rowCount > 0) {
      liked = false;
    } else {
      await pool.query(
        "INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING",
        [postId, userId]
      );
      liked = true;
    }
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS c FROM community_post_likes WHERE post_id = $1",
      [postId]
    );
    return { liked, likeCount: rows[0].c };
  }

  async getUserCommunityPosts(userId: number): Promise<CommunityPost[]> {
    const { rows } = await pool.query(
      "SELECT * FROM community_posts WHERE user_id = $1 AND status <> 'removed' ORDER BY id DESC",
      [userId]
    );
    return rows.map(rowToCommunityPost);
  }

  async deleteCommunityPost(id: number, userId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      "DELETE FROM community_posts WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  async listCommunityDestinations(): Promise<CommunityDestination[]> {
    const { rows } = await pool.query(
      `SELECT country_code, MAX(country_name) AS country_name, COUNT(*)::int AS post_count
       FROM community_posts WHERE status = 'active'
       GROUP BY country_code ORDER BY post_count DESC, country_name ASC`
    );
    return rows.map((r) => ({ countryCode: r.country_code, countryName: r.country_name, postCount: r.post_count }));
  }

  async listCommunityCities(countryCode: string): Promise<CommunityCity[]> {
    const { rows } = await pool.query(
      `SELECT city, COUNT(*)::int AS post_count
       FROM community_posts
       WHERE status = 'active' AND country_code = $1 AND city IS NOT NULL AND city <> ''
       GROUP BY city ORDER BY post_count DESC, city ASC`,
      [countryCode.toUpperCase()]
    );
    return rows.map((r) => ({ city: r.city, postCount: r.post_count }));
  }

  async reportCommunityPost(postId: number, userId: number, reason: string): Promise<void> {
    await pool.query(
      `INSERT INTO community_reports (post_id, user_id, reason) VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()`,
      [postId, userId, reason?.trim() || null]
    );
  }

  async getCommunityTranslation(postId: number, lang: string): Promise<CommunityPostTranslation | undefined> {
    const { rows } = await pool.query(
      "SELECT payload FROM community_post_translations WHERE post_id = $1 AND lang = $2",
      [postId, lang]
    );
    if (!rows[0]) return undefined;
    const p = rows[0].payload;
    return typeof p === "string" ? JSON.parse(p) : p;
  }

  async saveCommunityTranslation(postId: number, lang: string, payload: CommunityPostTranslation): Promise<void> {
    await pool.query(
      `INSERT INTO community_post_translations (post_id, lang, payload) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (post_id, lang) DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()`,
      [postId, lang, JSON.stringify(payload)]
    );
  }

  async adminListCommunityReports(): Promise<CommunityReport[]> {
    const { rows } = await pool.query(
      `SELECT r.id, r.post_id, r.user_id, r.reason, r.created_at,
              p.title AS post_title, p.status AS post_status, p.country_name AS country_name
       FROM community_reports r
       LEFT JOIN community_posts p ON p.id = r.post_id
       ORDER BY r.created_at DESC LIMIT 200`
    );
    return rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      reason: r.reason ?? null,
      createdAt: r.created_at?.toISOString?.() ?? r.created_at,
      postTitle: r.post_title ?? null,
      postStatus: r.post_status ?? null,
      countryName: r.country_name ?? null,
    }));
  }

  async adminRemoveCommunityPost(id: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      "UPDATE community_posts SET status = 'removed' WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async listCommunityComments(postId: number): Promise<CommunityComment[]> {
    const { rows } = await pool.query(
      "SELECT * FROM community_comments WHERE post_id = $1 ORDER BY id ASC",
      [postId]
    );
    return rows.map(rowToCommunityComment);
  }

  async createCommunityComment(postId: number, userId: number, authorName: string, body: string): Promise<CommunityComment> {
    const { rows } = await pool.query(
      `INSERT INTO community_comments (post_id, user_id, author_name, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [postId, userId, authorName, body.trim()]
    );
    return rowToCommunityComment(rows[0]);
  }

  async deleteCommunityComment(id: number, userId: number, isAdmin: boolean): Promise<boolean> {
    const { rowCount } = isAdmin
      ? await pool.query("DELETE FROM community_comments WHERE id = $1", [id])
      : await pool.query("DELETE FROM community_comments WHERE id = $1 AND user_id = $2", [id, userId]);
    return (rowCount ?? 0) > 0;
  }
}

export const storage = new PgStorage();
