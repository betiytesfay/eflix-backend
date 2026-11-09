import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@app/common';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
