import { Injectable, Logger } from '@nestjs/common';
import { Database } from '@/database/database';
import { sql } from 'kysely';

@Injectable()
export class PasswordResetRepository {
  private readonly logger = new Logger(PasswordResetRepository.name);

  constructor(private readonly db: Database) {}

  /**
   * Inserta una nueva fila en la tabla passwordreset.
   * Guardamos tanto token (texto) como token_hash (sha256).
   * expiresAtEpochMs: epoch en milisegundos.
   */
  async upsert(userRun: number, tokenPlain: string, tokenHash: string, expiresAtEpochMs: number): Promise<void> {
    const expirationDate = new Date(expiresAtEpochMs);

    try {
      await this.db
        .insertInto('passwordreset')
        .values({
          run: userRun,
          token: tokenPlain,
          token_hash: tokenHash,
          expiration: expirationDate,
          fecha_creacion: sql`now()`,
          used_at: null,
        })
        .execute();
    } catch (err) {
      this.logger.error('Error inserting passwordreset row', err as any);
      throw err;
    }
  }

  /**
   * Consume el token si es válido (no usado y no expirado).
   * Busca la fila (por run + token_hash + used_at IS NULL), comprueba expiración,
   * marca used_at = now() de forma transaccional y devuelve true si fue válido.
   *
   * Esto marca solo la fila encontrada (la más reciente si hubiera varias).
   */
  async consumeIfValid(userRun: number, tokenHash: string): Promise<boolean> {
    try {
      const result = await this.db.transaction().execute(async (trx) => {
        // Buscar la fila que coincida, prefiriendo la más reciente
        const row = await trx
          .selectFrom('passwordreset')
          .select(['id_passwordreset', 'expiration'])
          .where('run', '=', userRun)
          .where('token_hash', '=', tokenHash)
          .where('used_at', 'is', null)
          .orderBy('fecha_creacion', 'desc')
          .executeTakeFirst();

        if (!row) return false;

        const expiration = row.expiration ? new Date(row.expiration) : null;
        if (!expiration || expiration.getTime() < Date.now()) {
          // marcar como usada para evitar reintentos
          await trx
            .updateTable('passwordreset')
            .set({ used_at: sql`now()` })
            .where('id_passwordreset', '=', row.id_passwordreset)
            .execute();
          return false;
        }

        // marcar como usada y devolver true
        await trx
          .updateTable('passwordreset')
          .set({ used_at: sql`now()` })
          .where('id_passwordreset', '=', row.id_passwordreset)
          .execute();

        return true;
      });

      return Boolean(result);
    } catch (err) {
      this.logger.error('Error consuming passwordreset token', err as any);
      throw err;
    }
  }

  /**
   * Borrar todas las entradas para un run (opcional).
   */
  async deleteByRun(userRun: number): Promise<void> {
    await this.db.deleteFrom('passwordreset').where('run', '=', userRun).execute();
  }
}