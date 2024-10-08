import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '@src/entity/category.entity';

@Injectable()
export class CategoryLib {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async isExist(id: number) {
    return !!(await this.categoryRepo.findOneBy({ id }));
  }
}
