import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LoggerService } from '@src/logger/logger.service';
import { JwtAuthGuard } from '@src/shared/guard/jwt-auth.guard';
import { RequestWithTx, RequestWithUser } from '@src/shared/interface/request.interface';

import { TxRegisterRequest } from './dto/request/tx-register.request';
import { TxRegisterResponse } from './dto/response/tx-register.response';
import { TxUpdateRequest } from './dto/request/tx-update.request';
import { TxUpdateResponse } from './dto/response/tx-update.response';
import { TxShowRequest } from './dto/request/tx-show.request';
import { TxShowResponse } from './dto/response/tx-show.reponse';
import { TxSumRequest } from './dto/request/tx-sum.request';
import { TxSumResponse } from './dto/response/tx-sum.reponse';
import { TxShowDetailResponse } from './dto/response/tx-show-detail.response';

import { TxService } from './service/tx.service';
import { TxQueryService } from './service/tx-query.service';
import { OwnTxGuard } from './guard/own-tx.guard';

@UseGuards(JwtAuthGuard)
@Controller('txs')
export class TxController {
  constructor(
    private readonly txService: TxService,
    private readonly txQueryService: TxQueryService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(TxController.name);
  }

  @Post()
  async registerTx(@Req() req: RequestWithUser, @Body() dto: TxRegisterRequest) {
    const userId = req.user.id;
    const newTx = await this.txService.createTx(dto.toEntity(userId));

    return TxRegisterResponse.from(newTx);
  }

  @UseGuards(OwnTxGuard)
  @Put('/:id')
  async updateTx(@Param('id') txId: number, @Body() dto: TxUpdateRequest) {
    await this.txService.updateTx(txId, dto);
    const tx = await this.txQueryService.getTx(txId);

    return TxUpdateResponse.from(tx);
  }

  @Get()
  async showTxs(@Req() req: RequestWithUser, @Query() dto: TxShowRequest) {
    const userId = req.user.id;
    const txs = await this.txQueryService.getTxs(userId, dto);

    return TxShowResponse.from(txs);
  }

  @Get('/sum')
  async showTxsSum(@Req() req: RequestWithUser, @Query() dto: TxSumRequest) {
    const userId = req.user.id;
    const sum = await this.txQueryService.calculateSum(userId, dto);

    return TxSumResponse.from(sum.totalIncome, sum.totalExpense);
  }

  @UseGuards(OwnTxGuard)
  @Get('/:id')
  showTx(@Req() req: RequestWithTx) {
    const tx = req.tx;
    return TxShowDetailResponse.from(tx);
  }

  @UseGuards(OwnTxGuard)
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTx(@Req() req: RequestWithUser, @Param('id') txId: number) {
    await this.txService.deleteTx(txId);

    this.logger.log('Transaction is deleted.', {
      ip: req.ip,
      userId: req.user.id,
      txId,
      deletionType: 'Hard Delete',
    });

    return;
  }
}
