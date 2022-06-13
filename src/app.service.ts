import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import BlockOptions from './domain/blockType';

@Injectable()
export class AppService {
  arrBlockNumber: string[] = [];
  arrBlock: BlockOptions[] = [];
  counter = 0;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    setTimeout(async () => {
      await this.getArrNumber();
      if (this.arrBlockNumber.length > 0) {
        await this.getArrBlock();
      }
    }, 2000);
  }

  private async doRequest<T = unknown>(
    config: AxiosRequestConfig<unknown>,
  ): Promise<AxiosResponse<T>> {
    const etherscanConfig: AxiosRequestConfig = {
      headers: {
        Accept: 'application/json',
      },
    };
    const httpObservable = this.httpService.request({
      ...etherscanConfig,
      ...config,
    });
    const httpResponse = await lastValueFrom(httpObservable);
    return httpResponse;
  }

  private async getArrNumber(): Promise<void> {
    const lastBlockUrl =
      'https://api.etherscan.io/api?module=proxy&action=eth_blockNumber';
    const { data }: any = await this.doRequest({
      method: 'GET',
      url: lastBlockUrl,
    });
    if (!data.status) {
      const decimalBlockNumber: number = parseInt(data.result, 16);
      const rangeBlockNumbers: number = decimalBlockNumber - 100;
      for (let i = decimalBlockNumber; i > rangeBlockNumbers; i -= 1) {
        this.arrBlockNumber.push(`0x${Number(i).toString(16)}`);
      }
    }
  }

  private async getArrBlock(): Promise<void> {
    if (this.arrBlock.length === 100) {
      return;
    }
    const blockTransactionUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${
      this.arrBlockNumber[this.counter]
    }&boolean=true&apikey=${this.configService.get<string>('API_KEY')}`;
    const { data }: any = await this.doRequest({
      method: 'GET',
      url: blockTransactionUrl,
    });
    if (!data.status) {
      this.arrBlock.push(data.result);
      this.counter += 1;
      console.log(`Осталось загрузить ${100 - this.counter} блоков`);
    }
    this.getArrBlock();
  }

  public async getAdressChangedMore(): Promise<object> {
    const arrCompareInfo = this.arrBlock
      .map((block) => {
        return block.transactions.map((transaction) => {
          return {
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
          };
        });
      })
      .flat();

    let maxValue: string = arrCompareInfo[0].value;
    let adressWithMaxValue: string = arrCompareInfo[0].from;
    for (let i = 0; i < arrCompareInfo.length; i += 1) {
      if (arrCompareInfo[i].value > maxValue) {
        maxValue = arrCompareInfo[i].value;
        adressWithMaxValue = arrCompareInfo[i].from;
      }
    }
    return { maxValue, adressWithMaxValue };
  }
}
