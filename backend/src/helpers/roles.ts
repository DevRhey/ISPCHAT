import AppError from "../errors/AppError";
import User from "../models/User";

export const PRODUCT_MODE = process.env.PRODUCT_MODE || "owner_saas";

export const isPlatformOwner = (user?: { super?: boolean } | null): boolean =>
  Boolean(user?.super);

export const assertPlatformOwner = (user?: { super?: boolean } | null): void => {
  if (!isPlatformOwner(user)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const assertSameCompany = (
  userCompanyId: number | string | undefined,
  targetCompanyId: number | string | undefined,
  user?: { super?: boolean } | null
): void => {
  if (isPlatformOwner(user)) return;
  if (
    userCompanyId == null ||
    targetCompanyId == null ||
    String(userCompanyId) !== String(targetCompanyId)
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const loadRequestUser = async (userId: string | number): Promise<User> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }
  return user;
};
