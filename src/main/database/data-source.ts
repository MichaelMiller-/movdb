import { DataSource } from 'typeorm'
import { Actor } from './entities/Actor'
import { Category } from './entities/Category'
import { Movie } from './entities/Movie'
import { Publisher } from './entities/Publisher'
import { Tag } from './entities/Tag'
import { InitialSchema1790155800000 } from './migrations/1790155800000-InitialSchema'

export function createDataSource(databasePath: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: databasePath,
    enableWAL: true,
    synchronize: false,
    migrationsRun: true,
    migrationsTableName: 'migrations',
    entities: [Movie, Tag, Category, Actor, Publisher],
    migrations: [InitialSchema1790155800000]
  })
}
