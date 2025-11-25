export enum StartingParameters {
  Correct = 0,
  Invalid = 1,
  Changed = 2,
  NonStartingParameter = 3,
}

export const BatchParameterType = {
  FabricWeight: 0,
  MTFlotteRatio: 1,
  PartCount: 2,
  PartyNumber: 3,
  AccompanyNumber: 4,
  ClothLength: 5,
  Customer: 6,
  CustomerOrder: 7,
  FabricType: 8,
} as const
