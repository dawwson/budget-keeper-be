import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Budget } from '../../../entity/budget.entity';
import { BudgetCategory } from '../../../entity/budget-category.entity';
import { Category } from '../../../entity/category.entity';

import { CreateOrUpdateBudgetDto } from '../dto/create-or-update-budget.dto';
import { GetBudgetByYearAndMonthDto } from '../dto/get-budget-by-year-and-month.dto';

@Injectable()
export class SetBudgetService {
  constructor(private readonly dataSource: DataSource) {}

  // TODO: 엔티티 안으로 객체 생성 로직 넣어서 응집도 높이기
  async createOrUpdateBudget({
    userId,
    year,
    month,
    budgetsByCategory,
  }: CreateOrUpdateBudgetDto): Promise<void> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const budgetRepo = qr.manager.getRepository(Budget);
    const budgetCategoryRepo = qr.manager.getRepository(BudgetCategory);
    const categoryRepo = qr.manager.getRepository(Category);

    const categoryAmountMap = new Map();
    budgetsByCategory.forEach(({ categoryId, amount }) => {
      categoryAmountMap.set(categoryId, amount);
    });
    const categories = await categoryRepo.find();
    categories.forEach(({ id }) => {
      if (!categoryAmountMap.get(id)) {
        categoryAmountMap.set(id, 0);
      }
    });

    try {
      // 1. budget이 존재하는지 조회
      const budget = await budgetRepo.findOneBy({ userId, year, month });

      // budgetCategory 객체 생성
      const budgetCategories: BudgetCategory[] = [];
      // 총 예산 계산
      let totalAmount = 0;

      categoryAmountMap.forEach((amount, categoryId) => {
        totalAmount += amount;

        const budgetCategory = new BudgetCategory();
        budgetCategory.categoryId = categoryId;
        budgetCategory.amount = amount;

        budgetCategories.push(budgetCategory);
      });

      // 1-1. budget이 없으면 : budget -> budget category 생성
      if (!budget) {
        // budget 객체 생성
        const newBudget = new Budget();
        newBudget.year = year;
        newBudget.month = month;
        newBudget.userId = userId;
        newBudget.totalAmount = totalAmount;
        newBudget.budgetCategories = budgetCategories;

        await budgetRepo.save(newBudget);

        await qr.commitTransaction();
        await qr.release();
        return;
      }

      // 1-2. budget이 있으면 해당 Budget의 BudgetCategory 모두 삭제 후 새로 생성
      // budgetCategory 객체 생성
      budgetCategories.forEach((bc) => (bc.budget = budget));
      await budgetCategoryRepo.delete({ budgetId: budget.id });
      await budgetCategoryRepo.save(budgetCategories);

      await qr.commitTransaction();
      await qr.release();
    } catch (error) {
      await qr.rollbackTransaction();
      await qr.release();
      throw new InternalServerErrorException(error.message);
    }
  }

  getBudgetByYearAndMonth({ userId, year, month }: GetBudgetByYearAndMonthDto) {
    return this.dataSource.getRepository(Budget).findOne({
      where: { userId, year, month },
      relations: { budgetCategories: true },
    });
  }
}
