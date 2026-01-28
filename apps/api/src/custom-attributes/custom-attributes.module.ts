import { Module } from '@nestjs/common';
import { CustomAttributesService } from './custom-attributes.service';
import { CustomAttributesController } from './custom-attributes.controller';

@Module({
    providers: [CustomAttributesService],
    controllers: [CustomAttributesController],
    exports: [CustomAttributesService],
})
export class CustomAttributesModule { }
