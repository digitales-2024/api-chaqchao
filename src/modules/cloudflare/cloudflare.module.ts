import { Module } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';

@Module({
  providers: [CloudflareService],
  exports: [CloudflareService]
})
export class CloudflareModule {}
// Librerias: Package Json: Multer "@types/multer": "^1.4.12" y "@aws-sdk/client-s3": "^3.658.1",
