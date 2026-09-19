import { hash } from "bcryptjs";
import User from "../../models/User";

const ResetPassword = async (
  email: string,
  token: string,
  password: string
) => {
  if (!email || !token || !password) {
    return { status: 400, message: "Dados incompletos" };
  }

  const user = await User.findOne({
    where: { email, resetPassword: token }
  });

  if (!user) {
    return { status: 404, message: "Token inválido ou expirado" };
  }

  const passwordHash = await hash(password, 8);
  await user.update({
    passwordHash,
    resetPassword: ""
  });

  return { status: 200, message: "Senha redefinida com sucesso" };
};

export default ResetPassword;
