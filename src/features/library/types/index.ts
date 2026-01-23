// Result type for deleteUserBook operation
export type DeleteUserBookResult =
  | { type: 'success' }
  | { type: 'requires_confirmation'; message: string };
