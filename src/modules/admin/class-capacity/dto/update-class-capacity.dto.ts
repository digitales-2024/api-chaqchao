import { PartialType } from '@nestjs/swagger';
import { CreateClassCapacityDto } from './create-class-capacity.dto';

export class UpdateClassCapacityDto extends PartialType(CreateClassCapacityDto) {}
