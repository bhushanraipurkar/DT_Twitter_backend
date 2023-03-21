import { Response } from 'express';
import { SuccessResponse, FailureResponse } from '../types/Response';

export const sendSuccessResponse = <T>(
  res: Response,
  data: T | null,
  message = ''
): Response => {
  const response: SuccessResponse<T> = {
    data,
    message,
  };

  return res.status(200).json(response);
};

export const sendFailureResponse = (
  res: Response,
  error: string = ''
): Response => {
  const response: FailureResponse = {
    data: [],
    error,
  };

  return res.status(400).json(response);
};
