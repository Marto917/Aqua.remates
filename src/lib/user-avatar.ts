export const DEFAULT_USER_AVATAR = "/avatar-default.svg";

export function resolveUserAvatarUrl(imageUrl: string | null | undefined): string {
  const trimmed = imageUrl?.trim();
  return trimmed || DEFAULT_USER_AVATAR;
}

export function displayFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "Usuario";
}
