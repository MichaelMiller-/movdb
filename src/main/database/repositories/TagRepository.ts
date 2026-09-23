import type { DataSource, Repository } from 'typeorm'
import type { TagSummary } from '../../../shared/movies'
import { Tag } from '../entities/Tag'

export class TagRepository {
  private readonly tags: Repository<Tag>

  constructor(dataSource: DataSource) {
    this.tags = dataSource.getRepository(Tag)
  }

  async list(): Promise<TagSummary[]> {
    const tags = await this.tags.find({ order: { name: 'ASC' } })
    return tags.map(toTagSummary)
  }

  async create(nameInput: string): Promise<TagSummary> {
    const name = nameInput.trim()
    if (!name) throw new Error('Tag name must not be empty.')

    const existing = await this.tags
      .createQueryBuilder('tag')
      .where('LOWER(tag.name) = LOWER(:name)', { name })
      .getOne()

    if (existing) return toTagSummary(existing)

    return toTagSummary(await this.tags.save(this.tags.create({ name })))
  }
}

function toTagSummary(tag: Tag): TagSummary {
  return { id: tag.id, name: tag.name }
}
