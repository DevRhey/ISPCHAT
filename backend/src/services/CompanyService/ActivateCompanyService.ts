import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";
import Setting from "../../models/Setting";

interface Request {
  companyId: number | string;
  planId?: number;
  trialDays?: number;
  operationEnabled?: boolean;
}

const ActivateCompanyService = async ({
  companyId,
  planId,
  trialDays,
  operationEnabled = true
}: Request): Promise<Company> => {
  const company = await Company.findByPk(companyId);
  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }
  if (company.id === 1) {
    throw new AppError("A empresa da plataforma não usa este fluxo", 400);
  }

  const chosenPlanId = planId || company.planId;
  const plan = await Plan.findByPk(chosenPlanId);
  if (!plan) {
    throw new AppError("Plano Não Encontrado.", 400);
  }

  const trialSetting = await Setting.findOne({
    where: { companyId: 1, key: "trial" }
  });
  const days = Math.min(
    30,
    Math.max(
      1,
      Number(trialDays) || parseInt(String(trialSetting?.value || "7"), 10) || 7
    )
  );

  const due = new Date();
  due.setDate(due.getDate() + days);
  const dueDate = due.toISOString().split("T")[0];

  await company.update({
    status: true,
    planId: plan.id,
    dueDate,
    recurrence: company.recurrence || "MENSAL",
    activationState: "trial",
    operationEnabled: operationEnabled !== false,
    trialDays: days
  });

  const openInvoice = await Invoices.findOne({
    where: { companyId: company.id, status: "open" }
  });
  if (openInvoice) {
    await openInvoice.update({
      value: plan.value,
      detail: `${plan.name} (após trial)`,
      dueDate
    });
  } else {
    await Invoices.create({
      companyId: company.id,
      status: "open",
      value: plan.value,
      detail: `${plan.name} (após trial)`,
      dueDate
    });
  }

  return company.reload({ include: ["plan"] });
};

export default ActivateCompanyService;
