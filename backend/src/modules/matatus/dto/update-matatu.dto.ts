import { PartialType } from '@nestjs/mapped-types';
import { CreateMatatuDto } from './create-matatu.dto';

export class UpdateMatatuDto extends PartialType(CreateMatatuDto) {}
