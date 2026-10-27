import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;
const passwordMessage =
  'Password must be 10-128 characters and include uppercase, lowercase and a number';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @Matches(passwordRule, { message: passwordMessage })
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class GoogleLoginDto {
  @IsString()
  @MinLength(20)
  idToken!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(normalizeEmail)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @Matches(passwordRule, { message: passwordMessage })
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(20)
  token!: string;
}

export class TwoFactorVerifyDto {
  @IsString()
  @MinLength(20)
  challengeToken!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class TwoFactorCodeDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class TwoFactorDisableDto {
  @IsString()
  @MinLength(1)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @Matches(passwordRule, { message: passwordMessage })
  newPassword!: string;
}

export class DeleteAccountDto {
  @IsString()
  @MinLength(1)
  password!: string;
}
