import AppError from "../errors/AppError";
import Company from "../models/Company";

export const isDueDateExpired = (company?: Company | null): boolean => {
  if (!company?.dueDate) return false;
  const due = new Date(company.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return today > due;
};

export const isCompanyLoginBlocked = (
  company?: Company | null
): string | null => {
  if (!company) return "ERR_NO_COMPANY_FOUND";
  if (company.activationState === "pending") return "ERR_COMPANY_PENDING";
  if (company.activationState === "blocked" || company.status === false) {
    return "ERR_COMPANY_INACTIVE";
  }
  return null;
};

export const isCompanyOperationReleased = (
  company?: Company | null
): boolean => {
  if (!company) return false;
  if (company.activationState === "pending") return false;
  if (company.activationState === "blocked" || company.status === false) {
    return false;
  }
  if (company.operationEnabled === false) return false;
  if (isDueDateExpired(company)) return false;
  return true;
};

export const assertCompanyOperationReleased = async (
  companyId: number
): Promise<Company> => {
  const company = await Company.findByPk(companyId);
  if (!isCompanyOperationReleased(company)) {
    throw new AppError("ERR_OPERATION_NOT_RELEASED", 403);
  }
  return company as Company;
};
