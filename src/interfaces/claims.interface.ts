import { Claims } from '@prisma/client';

export type ClaimsData = Pick<
  Claims,
  | 'id'
  | 'claimantName'
  | 'claimantAddress'
  | 'documentNumber'
  | 'claimantEmail'
  | 'claimantPhone'
  | 'claimantRepresentative'
  | 'assetType'
  | 'amountClaimed'
  | 'assetDescription'
  | 'claimDescription'
  | 'dateClaim'
> &
  Partial<Pick<Claims, 'claimantAddress' | 'claimantRepresentative' | 'amountClaimed'>>;
