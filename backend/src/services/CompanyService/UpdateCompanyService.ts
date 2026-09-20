import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import Invoices from "../../models/Invoices";
import Plan from "../../models/Plan";

interface CompanyData {
  name: string;
  id?: number | string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  activationState?: string;
  operationEnabled?: boolean;
  trialDays?: number;
}

const UpdateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const company = await Company.findByPk(companyData.id);
  const {
    name,
    phone,
    email,
    status,
    planId,
    campaignsEnabled,
    dueDate,
    recurrence,
    activationState,
    operationEnabled,
    trialDays
  } = companyData;

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  const chosenPlanId = planId || company.planId;
  const plan = await Plan.findByPk(chosenPlanId);
  if (!plan) {
    throw new AppError("Plano Não Encontrado.", 400);
  }

  const openInvoices = await Invoices.findAll({
    where: {
      status: "open",
      companyId: company.id
    }
  });

  if (openInvoices.length > 1) {
    for (const invoice of openInvoices.slice(1)) {
      await invoice.update({ status: "cancelled" });
    }
  }

  const openInvoice = openInvoices[0];
  if (openInvoice) {
    await openInvoice.update({
      value: plan.value,
      detail: plan.name,
      dueDate: dueDate || openInvoice.dueDate
    });
  } else if (dueDate) {
    await Invoices.create({
      companyId: company.id,
      status: "open",
      value: plan.value,
      detail: plan.name,
      dueDate
    });
  }

  let nextState = activationState || company.activationState;
  if (status === false) {
    nextState = "blocked";
  } else if (status === true && nextState === "pending") {
    nextState = "trial";
  }

  await company.update({
    name,
    phone,
    email,
    status,
    planId: plan.id,
    dueDate,
    recurrence,
    activationState: nextState,
    operationEnabled:
      operationEnabled === undefined
        ? company.operationEnabled
        : operationEnabled !== false,
    trialDays: trialDays === undefined ? company.trialDays : trialDays
  });

  if (companyData.campaignsEnabled !== undefined) {
    const [setting, created] = await Setting.findOrCreate({
      where: {
        companyId: company.id,
        key: "campaignsEnabled"
      },
      defaults: {
        companyId: company.id,
        key: "campaignsEnabled",
        value: `${campaignsEnabled}`
      }
    });
    if (!created) {
      await setting.update({ value: `${campaignsEnabled}` });
    }
  }

  return company;
};

export default UpdateCompanyService;
