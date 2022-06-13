import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/adress')
  async getTransactionInfo(): Promise<object> {
    return this.appService.getAdressChangedMore();
  }
}
