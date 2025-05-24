import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class VoteStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the range (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the range (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of top users to return',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100) // Giới hạn để tránh query quá nặng
  limit?: number = 10;
} 