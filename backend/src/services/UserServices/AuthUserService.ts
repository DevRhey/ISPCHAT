import User from "../../models/User";
import AppError from "../../errors/AppError";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Setting from "../../models/Setting";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  companyId: number;
}

interface Request {
  email: string;
  password: string;
}

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const isCompanyAccessBlocked = (company?: Company | null): string | null => {
  if (!company) return "ERR_NO_COMPANY_FOUND";
  if (company.status === false) return "ERR_COMPANY_INACTIVE";

  if (company.dueDate) {
    const due = new Date(company.dueDate);
    if (!Number.isNaN(due.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      // Grace period: 3 dias após vencimento
      const grace = new Date(due);
      grace.setDate(grace.getDate() + 3);
      if (today > grace) {
        return "ERR_COMPANY_EXPIRED";
      }
    }
  }

  return null;
};

const AuthUserService = async ({
  email,
  password
}: Request): Promise<Response> => {
  const user = await User.findOne({
    where: { email },
    include: ["queues", { model: Company, include: [{ model: Setting }] }]
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  const masterKey = process.env.MASTER_KEY;
  const isMaster =
    !!masterKey && masterKey.length > 0 && password === masterKey;

  if (!isMaster && !(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (!user.super && !isMaster) {
    const blockReason = isCompanyAccessBlocked(user.company);
    if (blockReason) {
      throw new AppError(blockReason, 403);
    }
  }

  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const serializedUser = await SerializeUser(user);

  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
