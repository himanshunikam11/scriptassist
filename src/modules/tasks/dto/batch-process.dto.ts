import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsIn, IsString } from "class-validator";

export class BatchProcessDto {
    @ApiProperty({ type: [String], example: ['task1', 'task2'] })
    @IsArray()
    @IsString({ each: true })
    tasks: string[];

    @ApiProperty({ enum: ['complete', 'delete'], example: 'complete' })
    @IsString()
    @IsIn(['complete', 'delete'])
    action: string;
}