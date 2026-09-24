import type { DataSource, Repository } from 'typeorm'
import type { ActorSummary } from '../../../shared/movies'
import { Actor } from '../entities/Actor'

export class ActorRepository {
  private readonly actors: Repository<Actor>

  constructor(dataSource: DataSource) {
    this.actors = dataSource.getRepository(Actor)
  }

  async list(): Promise<ActorSummary[]> {
    const actors = await this.actors.find({ order: { name: 'ASC' } })
    return actors.map(toActorSummary)
  }

  async create(nameInput: string): Promise<ActorSummary> {
    const name = nameInput.trim()
    if (!name) throw new Error('Actor name must not be empty.')

    const existing = await this.actors
      .createQueryBuilder('actor')
      .where('LOWER(actor.name) = LOWER(:name)', { name })
      .getOne()

    if (existing) return toActorSummary(existing)

    return toActorSummary(await this.actors.save(this.actors.create({ name })))
  }
}

function toActorSummary(actor: Actor): ActorSummary {
  return { id: actor.id, name: actor.name }
}
