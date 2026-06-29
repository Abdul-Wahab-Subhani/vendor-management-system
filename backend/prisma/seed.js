/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || "superadmin@vms.app";
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: superAdminEmail,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        isEmailVerified: true,
      },
    });
    console.log(`✔ Super admin created: ${superAdminEmail} / ${superAdminPassword}`);
  } else {
    console.log("✔ Super admin already exists, skipping.");
  }

  const defaultTemplates = [
    {
      key: "general_announcement",
      name: "General Announcement",
      subject: "📢 Announcement: {{title}}",
      htmlBody: "<h1>{{title}}</h1><p>Hi {{name}},</p><p>{{message}}</p>",
      variables: ["title", "name", "message"],
    },
    {
      key: "maintenance_notice",
      name: "Scheduled Maintenance Notice",
      subject: "Scheduled maintenance on {{date}}",
      htmlBody:
        "<h1>Scheduled Maintenance</h1><p>Hi {{name}},</p><p>The platform will be undergoing maintenance on {{date}} from {{startTime}} to {{endTime}}. We apologize for any inconvenience.</p>",
      variables: ["name", "date", "startTime", "endTime"],
    },
  ];

  for (const t of defaultTemplates) {
    await prisma.emailTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
  }
  console.log(`✔ Seeded ${defaultTemplates.length} default email templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
