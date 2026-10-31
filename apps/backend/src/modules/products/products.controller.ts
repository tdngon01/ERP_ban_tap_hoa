import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('search') search?: string, @Query('category') category?: string) {
    return this.productsService.findAll(search, category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Post('convert')
  async convert(@Body() body: { productId: string; uomName: string; quantity: number }) {
    return this.productsService.calculateConversion(body.productId, body.uomName, body.quantity);
  }
}

