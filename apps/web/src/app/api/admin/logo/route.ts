import { requireAdmin } from "@/server/admin"
import { ApiError, handle } from "@/server/api"
import { removeLogo, uploadLogo } from "@/server/settings"

export const POST = handle(async (request: Request) => {
  await requireAdmin()
  const file = (await request.formData().catch(() => null))?.get("file")
  if (!(file instanceof File)) throw new ApiError("INVALID_FILE")
  return uploadLogo(file)
})

export const DELETE = handle(async () => {
  await requireAdmin()
  return removeLogo()
})
