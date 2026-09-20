import Plan from "../../models/Plan";

const FindAllPlanServiceRegister = async (): Promise<Plan[]> => {
  const plans = await Plan.findAll({
    where: {
      useInternal: true
    },
    order: [["value", "ASC"]]
  });
  return plans;
};

export default FindAllPlanServiceRegister;
