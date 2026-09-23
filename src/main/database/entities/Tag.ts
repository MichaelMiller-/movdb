import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Movie } from './Movie'

@Entity({ name: 'tags' })
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', unique: true })
  name!: string

  @ManyToMany(() => Movie, (movie) => movie.tags)
  movies!: Movie[]
}
