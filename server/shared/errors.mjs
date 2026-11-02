export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assert(condition, message, status = 422) {
  if (!condition) throw new AppError(status, message);
}
