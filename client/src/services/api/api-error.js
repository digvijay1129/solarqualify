export class ApiError extends Error {
  constructor(message, { status = 0, details = null, cause = undefined } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
