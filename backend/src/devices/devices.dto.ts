import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PairDeviceDto {
  @IsString()
  @Length(6, 16)
  code!: string;

  @IsString()
  @Length(1, 80)
  name!: string;

  @IsString()
  @MaxLength(80)
  manufacturer!: string;

  @IsString()
  @MaxLength(80)
  model!: string;

  @IsString()
  @MaxLength(40)
  androidVersion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  fcmToken?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  lostMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  locationHistoryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  historyRetentionDays?: number;

  @IsOptional()
  @IsBoolean()
  notifyOnReconnect?: boolean;
}

export class RingDto {
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  durationSeconds?: number;

  @IsOptional()
  @IsIn(['siren', 'alarm', 'ringtone'])
  sound?: 'siren' | 'alarm' | 'ringtone';

  @IsOptional()
  @IsBoolean()
  vibration?: boolean;

  @IsOptional()
  @IsBoolean()
  flash?: boolean;
}

export class LostModeDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;
}

export class RecoveryMessageDto {
  @IsString()
  @Length(1, 300)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;
}

export class VibrateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds?: number;
}

export class FlashDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationSeconds?: number;
}

export class HistoryQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class HeartbeatDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsOptional()
  @IsBoolean()
  charging?: boolean;

  @IsOptional()
  @IsBoolean()
  networkConnected?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  networkType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;
}

export class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100_000)
  accuracyMeters?: number;

  @IsOptional()
  @IsNumber()
  altitudeMeters?: number;

  @IsOptional()
  @IsNumber()
  speedMps?: number;

  @IsOptional()
  @IsNumber()
  headingDegrees?: number;

  @IsDateString()
  capturedAt!: string;

  @IsOptional()
  @IsBoolean()
  isMock?: boolean;

  @IsOptional()
  @IsIn(['gps', 'network', 'fused', 'passive', 'manual'])
  source?: string;
}

export class CommandAckDto {
  @IsIn(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class PushTokenDto {
  @IsString()
  @MaxLength(4096)
  token!: string;
}
