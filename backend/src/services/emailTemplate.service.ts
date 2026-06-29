import { prisma } from "../config/prisma";
import { NotFoundError, ConflictError } from "../utils/errors";
import { CreateTemplateInput } from "../validators/email.validators";

/** Replaces {{variableName}} placeholders with provided values. */
export function renderTemplateString(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => variables[key] ?? "");
}

export const EmailTemplateService = {
  async list() {
    return prisma.emailTemplate.findMany({ orderBy: { createdAt: "desc" } });
  },

  async getByKey(key: string) {
    const template = await prisma.emailTemplate.findUnique({ where: { key } });
    if (!template) throw new NotFoundError("Email template not found");
    return template;
  },

  async create(input: CreateTemplateInput) {
    const existing = await prisma.emailTemplate.findUnique({ where: { key: input.key } });
    if (existing) throw new ConflictError("A template with this key already exists");
    return prisma.emailTemplate.create({ data: input });
  },

  async update(key: string, data: Partial<CreateTemplateInput>) {
    await this.getByKey(key);
    return prisma.emailTemplate.update({ where: { key }, data });
  },

  async delete(key: string) {
    await this.getByKey(key);
    return prisma.emailTemplate.delete({ where: { key } });
  },

  async preview(key: string, variables: Record<string, string>) {
    const template = await this.getByKey(key);
    return {
      subject: renderTemplateString(template.subject, variables),
      html: renderTemplateString(template.htmlBody, variables),
    };
  },
};
