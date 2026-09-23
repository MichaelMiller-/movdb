import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Actor } from './Actor'
import { Category } from './Category'
import { Publisher } from './Publisher'
import { Tag } from './Tag'

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', nullable: true })
  title!: string

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate!: string | null

  @Column({ type: 'text' })
  filename!: string

  @Column({ type: 'text', unique: true })
  filepath!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({ name: 'poster_path', type: 'text', nullable: true })
  posterPath!: string | null

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds!: number | null

  @Column({ type: 'real', nullable: true })
  rating!: number | null

  @Column({ name: 'playback_position_seconds', type: 'integer', default: 0 })
  playbackPositionSeconds!: number

  @Column({ name: 'last_played_at', type: 'datetime', nullable: true })
  lastPlayedAt!: Date | null

  @ManyToOne(() => Publisher, (publisher) => publisher.movies, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'publisher_id' })
  publisher!: Publisher | null

  @ManyToMany(() => Tag, (tag) => tag.movies)
  @JoinTable({
    name: 'movie_tags',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags!: Tag[]

  @ManyToMany(() => Category, (category) => category.movies)
  @JoinTable({
    name: 'movie_categories',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories!: Category[]

  @ManyToMany(() => Actor, (actor) => actor.movies)
  @JoinTable({
    name: 'movie_actors',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'actor_id', referencedColumnName: 'id' }
  })
  actors!: Actor[]

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date
}
