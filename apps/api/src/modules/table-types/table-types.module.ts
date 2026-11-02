import { Module } from '@nestjs/common';
import { TableTypesService } from './table-types.service';
import { TableTypesController } from './table-types.controller';

@Module({
  controllers: [TableTypesController],
  providers: [TableTypesService],
  exports: [TableTypesService],
})
export class TableTypesModule {}

