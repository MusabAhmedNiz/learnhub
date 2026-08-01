/**
 * Extract a displayable error string from a TanStack Form validation error.
 * Errors can be a plain string, a ZodIssue-like object with `.message`, or undefined.
 */
export function getFieldError(
  errors: unknown[] | undefined,
): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const err = errors[0];
  if (err == null) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    return (err as { message: string }).message;
  }
  return undefined;
}
