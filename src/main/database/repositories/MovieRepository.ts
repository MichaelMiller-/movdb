import { stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { In, type DataSource, type Repository } from 'typeorm'
import type { MovieCreateInput, MovieSummary } from '../../../shared/movies'
import { Actor } from '../entities/Actor'
import { Movie } from '../entities/Movie'
import { Publisher } from '../entities/Publisher'
import { Tag } from '../entities/Tag'
import { isAbsoluteMovieFilePath, normalizeMovieFilePath } from '../movieFilePath'

export class MovieRepository {
  private readonly movies: Repository<Movie>
  private readonly publishers: Repository<Publisher>
  private readonly tags: Repository<Tag>
  private readonly actors: Repository<Actor>

  constructor(dataSource: DataSource) {
    this.movies = dataSource.getRepository(Movie)
    this.publishers = dataSource.getRepository(Publisher)
    this.tags = dataSource.getRepository(Tag)
    this.actors = dataSource.getRepository(Actor)
  }

  async list(): Promise<MovieSummary[]> {
    const movies = await this.movies.find({
      relations: { publisher: true, tags: true, actors: true },
      order: { title: 'ASC' }
    })

    return Promise.all(movies.map(toMovieSummary))
  }

  async create(input: MovieCreateInput): Promise<MovieSummary> {
    const title = input.title.trim()
    const filepath = normalizeMovieFilePath(input.filepath)

    if (!title) throw new Error('Movie title must not be empty.')

    const existing = await this.movies.findOneBy({ filepath })
    if (existing) throw new Error('This movie file is already in the library.')

    let publisher: Publisher | null = null
    const publisherName = input.publisherName?.trim()

    if (publisherName) {
      publisher = await this.publishers.findOneBy({ name: publisherName })
      if (!publisher) {
        publisher = await this.publishers.save(this.publishers.create({ name: publisherName }))
      }
    }

    const movie = this.movies.create({
      title,
      releaseDate: input.releaseDate || null,
      filename: basename(filepath),
      filepath,
      publisher
    })

    return toMovieSummary(await this.movies.save(movie))
  }

  async updateTags(id: number, tagIds: number[]): Promise<MovieSummary> {
    const movie = await this.movies.findOne({
      where: { id },
      relations: { publisher: true, tags: true, actors: true }
    })

    if (!movie) throw new Error('Movie not found.')

    const uniqueTagIds = [...new Set(tagIds)]
    const tags = uniqueTagIds.length > 0
      ? await this.tags.findBy({ id: In(uniqueTagIds) })
      : []

    if (tags.length !== uniqueTagIds.length) {
      throw new Error('One or more selected tags do not exist.')
    }

    movie.tags = tags
    return toMovieSummary(await this.movies.save(movie))
  }

  async updateActors(id: number, actorIds: number[]): Promise<MovieSummary> {
    const movie = await this.movies.findOne({
      where: { id },
      relations: { publisher: true, tags: true, actors: true }
    })

    if (!movie) throw new Error('Movie not found.')

    const uniqueActorIds = [...new Set(actorIds)]
    const actors = uniqueActorIds.length > 0
      ? await this.actors.findBy({ id: In(uniqueActorIds) })
      : []

    if (actors.length !== uniqueActorIds.length) {
      throw new Error('One or more selected actors do not exist.')
    }

    movie.actors = actors
    return toMovieSummary(await this.movies.save(movie))
  }

  async findById(id: number): Promise<MovieSummary | null> {
    const movie = await this.movies.findOne({
      where: { id },
      relations: { publisher: true, tags: true, actors: true }
    })

    return movie ? toMovieSummary(movie) : null
  }

  async delete(id: number): Promise<void> {
    await this.movies.delete(id)
  }
}

async function toMovieSummary(movie: Movie): Promise<MovieSummary> {
  return {
    id: movie.id,
    title: movie.title,
    releaseDate: movie.releaseDate,
    publisherName: movie.publisher?.name ?? null,
    filename: movie.filename,
    filepath: movie.filepath,
    durationSeconds: movie.durationSeconds,
    available: await isRegularFile(movie.filepath),
    tags: (movie.tags ?? [])
      .map((tag) => ({ id: tag.id, name: tag.name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    actors: (movie.actors ?? [])
      .map((actor) => ({ id: actor.id, name: actor.name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    createdAt: movie.createdAt.toISOString()
  }
}

async function isRegularFile(filepath: string): Promise<boolean> {
  if (!isAbsoluteMovieFilePath(filepath)) return false

  try {
    return (await stat(filepath)).isFile()
  } catch {
    return false
  }
}
