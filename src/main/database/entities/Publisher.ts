import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Movie } from './Movie'

@Entity({ name: 'publishers' })
export class Publisher {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'text', unique: true })
  name!: string

  @OneToMany(() => Movie, (movie) => movie.publisher)
  movies!: Movie[]
}
