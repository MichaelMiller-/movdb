import type { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1790155800000 implements MigrationInterface {
  name = 'InitialSchema1790155800000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('PRAGMA foreign_keys = ON')

    await queryRunner.query(`
      CREATE TABLE "publishers" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL UNIQUE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL UNIQUE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL UNIQUE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "actors" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL UNIQUE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "movies" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "title" TEXT NOT NULL,
        "original_title" TEXT,
        "release_date" date,
        "filename" TEXT NOT NULL,
        "filepath" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "poster_path" TEXT,
        "duration_seconds" INTEGER,
        "rating" REAL,
        "playback_position_seconds" INTEGER NOT NULL DEFAULT 0,
        "last_played_at" datetime,
        "publisher_id" INTEGER,
        "created_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_movies_publisher" FOREIGN KEY ("publisher_id")
          REFERENCES "publishers" ("id") ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "movie_tags" (
        "movie_id" INTEGER NOT NULL,
        "tag_id" INTEGER NOT NULL,
        PRIMARY KEY ("movie_id", "tag_id"),
        CONSTRAINT "fk_movie_tags_movie" FOREIGN KEY ("movie_id")
          REFERENCES "movies" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_movie_tags_tag" FOREIGN KEY ("tag_id")
          REFERENCES "tags" ("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "movie_categories" (
        "movie_id" INTEGER NOT NULL,
        "category_id" INTEGER NOT NULL,
        PRIMARY KEY ("movie_id", "category_id"),
        CONSTRAINT "fk_movie_categories_movie" FOREIGN KEY ("movie_id")
          REFERENCES "movies" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_movie_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "categories" ("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "movie_actors" (
        "movie_id" INTEGER NOT NULL,
        "actor_id" INTEGER NOT NULL,
        PRIMARY KEY ("movie_id", "actor_id"),
        CONSTRAINT "fk_movie_actors_movie" FOREIGN KEY ("movie_id")
          REFERENCES "movies" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_movie_actors_actor" FOREIGN KEY ("actor_id")
          REFERENCES "actors" ("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query('CREATE INDEX "idx_movies_title" ON "movies" ("title")')
    await queryRunner.query('CREATE INDEX "idx_movies_release_date" ON "movies" ("release_date")')
    await queryRunner.query('CREATE INDEX "idx_movies_publisher" ON "movies" ("publisher_id")')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "movie_actors"')
    await queryRunner.query('DROP TABLE IF EXISTS "movie_categories"')
    await queryRunner.query('DROP TABLE IF EXISTS "movie_tags"')
    await queryRunner.query('DROP TABLE IF EXISTS "movies"')
    await queryRunner.query('DROP TABLE IF EXISTS "actors"')
    await queryRunner.query('DROP TABLE IF EXISTS "categories"')
    await queryRunner.query('DROP TABLE IF EXISTS "tags"')
    await queryRunner.query('DROP TABLE IF EXISTS "publishers"')
  }
}
