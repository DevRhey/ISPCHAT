import { Request, Response } from "express";
import * as Yup from "yup";
// import { getIO } from "../libs/socket";
import authConfig from "../config/auth";
import AppError from "../errors/AppError";
import Company from "../models/Company";
import fs from "fs";
import path from "path";
import { verify } from "jsonwebtoken";
import User from "../models/User";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import ListCompaniesPlanService from "../services/CompanyService/ListCompaniesPlanService";
import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import ShowPlanCompanyService from "../services/CompanyService/ShowPlanCompanyService";
import UpdateCompanyService from "../services/CompanyService/UpdateCompanyService";
import ActivateCompanyService from "../services/CompanyService/ActivateCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import {
  assertSameCompany,
  isPlatformOwner,
  loadRequestUser
} from "../helpers/roles";
import Plan from "../models/Plan";

const publicFolder = path.resolve(__dirname, "..", "..", "public");

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

type CompanyData = {
  name: string;
  id?: number;
  phone?: string;
  email?: string;
  password?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
  activationState?: string;
  operationEnabled?: boolean;
  trialDays?: number;
};

type SchedulesData = {
  schedules: [];
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { companies, count, hasMore } = await ListCompaniesService({
    searchParam,
    pageNumber
  });

  return res.json({ companies, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newCompany: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newCompany);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const isPublicSignup = req.path.includes("/cadastro") || !req.user;
  if (isPublicSignup && req.body.acceptTerms !== true) {
    throw new AppError("Aceite a licença de uso para criar a conta", 400);
  }
  if (isPublicSignup) {
    newCompany.status = false;
    newCompany.dueDate = undefined;
    newCompany.activationState = "pending";
    newCompany.operationEnabled = false;

    if (newCompany.planId) {
      const plan = await Plan.findByPk(newCompany.planId);
      if (!plan || plan.useInternal !== true) {
        throw new AppError("Plano inválido para cadastro público", 400);
      }
    }
  }
  if (!isPublicSignup && req.user) {
    const requestUser = await loadRequestUser(req.user.id);
    if (!isPlatformOwner(requestUser)) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }

  const company = await CreateCompanyService({
    ...newCompany,
    status: isPublicSignup ? false : newCompany.status !== false,
    activationState: isPublicSignup
      ? "pending"
      : newCompany.activationState || "active",
    operationEnabled: isPublicSignup
      ? false
      : newCompany.operationEnabled !== false
  });

  return res.status(200).json(company);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const requestUser = await loadRequestUser(req.user.id);
  assertSameCompany(req.user.companyId, id, requestUser);

  const company = await ShowCompanyService(id);

  return res.status(200).json(company);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const companies: Company[] = await FindAllCompaniesService();

  return res.status(200).json(companies);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const companyData: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(companyData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;
  const requestUser = await loadRequestUser(req.user.id);
  if (!isPlatformOwner(requestUser)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const company = await UpdateCompanyService({ id, ...companyData });

  return res.status(200).json(company);
};

export const activate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const requestUser = await loadRequestUser(req.user.id);
  if (!isPlatformOwner(requestUser)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { id } = req.params;
  const { planId, trialDays, operationEnabled } = req.body;
  const company = await ActivateCompanyService({
    companyId: id,
    planId,
    trialDays,
    operationEnabled
  });

  return res.status(200).json(company);
};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;

  const requestUser = await loadRequestUser(req.user.id);
  assertSameCompany(req.user.companyId, id, requestUser);

  const company = await UpdateSchedulesService({
    id,
    schedules
  });

  return res.status(200).json(company);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }
  const { id } = req.params;

  if (fs.existsSync(`${publicFolder}/company${id}/`)) {

    const removefolder = await fs.rmdirSync(`${publicFolder}/company${id}/`, {
      recursive: true,
    });

  }

  const company = await DeleteCompanyService(id);


  //fs.remove(`${publicFolder}/company${id}/`);

  return res.status(200).json(company);
};

export const listPlan = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id: requestUserId, profile, companyId } = decoded as TokenPayload;
  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === true || companyId.toString() === id) {
    const company = await ShowPlanCompanyService(id);
    return res.status(200).json(company);
  }
  return res.status(403).json({ error: "ERR_NO_PERMISSION" });

};

export const indexPlan = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  const { id, profile, companyId } = decoded as TokenPayload;
  // const company = await Company.findByPk(companyId);
  const requestUser = await User.findByPk(id);

  if (requestUser.super === true) {
    const companies = await ListCompaniesPlanService();
    return res.json({ companies });
  } else {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  }

};