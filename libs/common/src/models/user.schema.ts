import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractDocument } from '@app/common';

@Schema({ versionKey: false })
@ObjectType()
export class UserDocument extends AbstractDocument {
  @Prop()
  @Field()
  email: string;

  @Prop()
  password: string;

  @Prop()
  @Field(() => [String])
  roles?: string[];
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
