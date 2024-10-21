import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healtCheck(): boolean {
    return true;
  }
}
