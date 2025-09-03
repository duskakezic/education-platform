import { IUserRepository } from "../../../Domain/repositories/users/IUserRepository";
import { User } from "../../../Domain/models/User";
import db from "../../connection/DbConnectionPool";

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    try {
      const query = `
        INSERT INTO users (korisnicko_ime, uloga, lozinka)
        VALUES ($1, $2, $3)
        RETURNING id
      `;

      const result = await db.query(query, [
        user.korisnickoIme,
        user.uloga,
        user.lozinka,
      ]);

      if (result.rows.length > 0) {
        return new User(result.rows[0].id, user.korisnickoIme, user.uloga, user.lozinka);
      }

      return new User();
    } catch (error) {
      console.error('Error creating user:', error);
      return new User();
    }
  }

  async getById(id: number): Promise<User> {
    try {
      const query = `SELECT id, korisnicko_ime, uloga, lozinka FROM users WHERE id = $1`;
      const result = await db.query(query, [id]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new User(row.id, row.korisnicko_ime, row.uloga, row.lozinka);
      }

      return new User();
    } catch {
      return new User();
    }
  }

  async getByUsername(korisnickoIme: string): Promise<User> {
    try {
      const query = `
        SELECT id, korisnicko_ime, uloga, lozinka
        FROM users 
        WHERE korisnicko_ime = $1
      `;

      const result = await db.query(query, [korisnickoIme]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new User(row.id, row.korisnicko_ime, row.uloga, row.lozinka);
      }

      return new User();
    } catch (error) {
      console.log("user get by username: " + error);
      return new User();
    }
  }

  async getAll(): Promise<User[]> {
    try {
      const query = `SELECT id, korisnicko_ime, uloga, lozinka FROM users ORDER BY id ASC`;
      const result = await db.query(query);

      return result.rows.map(
        (row) => new User(row.id, row.korisnicko_ime, row.uloga, row.lozinka)
      );
    } catch {
      return [];
    }
  }

  async update(user: User): Promise<User> {
    try {
      const query = `
        UPDATE users 
        SET korisnicko_ime = $1, lozinka = $2, uloga = $3
        WHERE id = $4
      `;

      const result = await db.query(query, [
        user.korisnickoIme,
        user.lozinka,
        user.uloga,
        user.id,
      ]);

      if (result.rowCount && result.rowCount > 0) {
        return user;
      }

      return new User();
    } catch {
      return new User();
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM users 
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*)::int as count 
        FROM users 
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      return result.rows[0]?.count > 0;
    } catch {
      return false;
    }
  }
}