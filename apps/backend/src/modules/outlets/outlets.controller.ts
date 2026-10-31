import { Controller, Get, Post, Put, Body, Param, Query, Inject } from '@nestjs/common';
import { OutletsService } from './outlets.service';

@Controller('api/outlets')
export class OutletsController {
  constructor(@Inject(OutletsService) private readonly outletsService: OutletsService) {}

  @Get()
  async findAll(@Query('routeId') routeId?: string, @Query('search') search?: string) {
    return this.outletsService.findAll(routeId, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.outletsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.outletsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.outletsService.update(id, body);
  }
}

