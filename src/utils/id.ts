/** Унікальний ідентифікатор. crypto.randomUUID() вбудований у сучасні браузери та Node. */
export function createId(): string {
  return crypto.randomUUID()
}
