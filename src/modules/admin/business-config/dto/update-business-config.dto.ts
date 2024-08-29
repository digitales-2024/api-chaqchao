import { PartialType } from '@nestjs/swagger';
import { CreateBusinessConfigDto } from './create-business-config.dto';

export class UpdateBusinessConfigDto extends PartialType(CreateBusinessConfigDto) {}
