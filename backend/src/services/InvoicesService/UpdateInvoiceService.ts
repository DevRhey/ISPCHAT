import AppError from "../../errors/AppError";
import Invoice from "../../models/Invoices";

interface InvoiceData {
  status: string;
  id?: number | string;
  companyId: number;
}

const UpdateInvoiceService = async (
  InvoiceData: InvoiceData
): Promise<Invoice> => {
  const { id, status, companyId } = InvoiceData;

  const invoice = await Invoice.findOne({
    where: { id, companyId }
  });

  if (!invoice) {
    throw new AppError("ERR_NO_INVOICE_FOUND", 404);
  }

  await invoice.update({ status });

  return invoice;
};

export default UpdateInvoiceService;
