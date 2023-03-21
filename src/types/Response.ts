import { Response } from 'express';

export interface SuccessResponse<T> {
  data: T | null;
  message?: string;
}

export interface FailureResponse {
  data: [];
  error: string;
}
