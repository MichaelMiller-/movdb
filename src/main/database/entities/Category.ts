import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Movie } from './Movie'

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', unique: true })
  name!: string

  @ManyToMany(() => Movie, (movie) => movie.categories)
  movies!: Movie[]
}
