import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Movie } from './Movie'

@Entity({ name: 'actors' })
export class Actor {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', unique: true })
  name!: string

  @ManyToMany(() => Movie, (movie) => movie.actors)
  movies!: Movie[]
}
