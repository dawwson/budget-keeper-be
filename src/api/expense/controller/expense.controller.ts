import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { RequestWithUser } from '@src/shared/interface/request-with-user.interface';
import { JwtAuthGuard } from '@src/shared/guard/jwt-auth.guard';

import { OwnExpenseGuard } from '../guard/own-expense.guard';
import { ExpenseService } from '../service/expense.service';
import { ExpenseStatsService } from '../service/expense-stats.service';
import { ExpenseQueryService } from '../service/expense-query.service';

import { ExpenseRegisterRequest } from './dto/request/expense-register.request';
import { ExpenseRegisterResponse } from './dto/response/expense-register.response';
import { ExpenseUpdateRequest } from './dto/request/expense-update.request';
import { ExpenseUpdateResponse } from './dto/response/expense-update.response';
import { ExpenseShowRequest } from './dto/request/expense-show.request';
import { ExpenseShowResponse } from './dto/response/expense-show.reponse';
import { ExpenseStatsResponse } from './dto/response/expense-stats.response';
import { ExpenseShowDetailResponse } from './dto/response/expense-show-detail.response';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly expenseStatsService: ExpenseStatsService,
    private readonly expenseQueryService: ExpenseQueryService,
  ) {}

  @Post()
  async registerExpense(@Req() req: RequestWithUser, @Body() dto: ExpenseRegisterRequest) {
    const expense = await this.expenseService.createExpense(dto.toEntity(req.user.id));

    return ExpenseRegisterResponse.from(expense);
  }

  @UseGuards(OwnExpenseGuard)
  @Patch(':id')
  async updateExpense(@Param('id') expenseId: number, @Body() dto: ExpenseUpdateRequest) {
    await this.expenseService.updateExpense(dto.toEntity(expenseId));
    const expense = await this.expenseQueryService.getExpenseById(expenseId);

    return ExpenseUpdateResponse.from(expense);
  }

  @Get()
  async showExpenses(@Req() req: RequestWithUser, @Query() dto: ExpenseShowRequest) {
    const userId = req.user.id;

    const expenses = await this.expenseQueryService.getExpensesBy(userId, dto);
    const expensesByCategory = await this.expenseQueryService.getExpensesByCatogory(userId, dto);

    return ExpenseShowResponse.from(expenses, expensesByCategory);
  }

  @Get('statistics')
  async showExpenseStats(@Req() req: RequestWithUser) {
    const userId = req.user.id;

    // 지난달, 이번달 카테고리별 지출 합계
    const monthlyExpenseByCategory = await this.expenseStatsService.getMonthlyExpenseByCategory(userId);

    // 저번부, 이번주 카테고리별 지출 합계
    const weeklyExpenseByCategory = await this.expenseStatsService.getWeeklyExpenseByCategory(userId);

    return ExpenseStatsResponse.from(monthlyExpenseByCategory, weeklyExpenseByCategory);
  }

  @UseGuards(OwnExpenseGuard)
  @Get(':id')
  async showExpenseDetail(@Param('id') id: number) {
    const expense = await this.expenseQueryService.getExpenseById(id);

    return ExpenseShowDetailResponse.from(expense);
  }

  @UseGuards(OwnExpenseGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteExpense(@Param('id') id: number) {
    await this.expenseService.deleteExpenseById(id);
    return;
  }
}
