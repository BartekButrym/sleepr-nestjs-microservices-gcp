import { IsCreditCard, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CardDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  cvc: string;

  @IsNumber()
  @Field()
  exp_month: number;

  @IsNumber()
  @Field()
  exp_year: number;

  @IsCreditCard()
  @Field()
  number: string;
}
