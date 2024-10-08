import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { Category } from './category.entity';

@Entity('budget_category')
@Unique('UQ_BUDGET_ID_CATEGORY_ID', ['budget', 'category'])
@Check(`"amount" >= 0`)
export class BudgetCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Budget, { nullable: false })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column()
  budgetId: number;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ unique: false })
  categoryId: number;

  @Column({ type: 'integer' })
  amount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
