import { Controller, Get } from '@nestjs/common';
import type { PublicCategory } from '@matal/shared-types';
import { CategoriesService } from './categories.service';

/** Public reference data. Route: GET /api/v1/categories */
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(): Promise<PublicCategory[]> {
    return this.categoriesService.list();
  }
}
