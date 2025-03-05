import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Insert Roles
  const roles = [];
  for (let i = 0; i < 3; i++) {
    const role = await prisma.role.create({
      data: {
        role: faker.person.jobTitle(),
        permission: { arrayPermission: [1, 2, 3] },
        description: faker.lorem.sentence(),
      },
    });
    roles.push(role);
  }

  // Insert Users
  const users = [];
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
        status: true,
        role: faker.helpers.arrayElement([1, 2, 3]),
      },
    });
    users.push(user);
  }

  // Insert Settings
  await prisma.settings.create({
    data: {
      tunjangan: faker.finance.amount(1000000, 5000000, 0, "Rp "),
      color: faker.color.human(),
    },
  });

  // Insert Periode
  const periodes = [];
  for (let i = 0; i < 2; i++) {
    const periode = await prisma.periode.create({
      data: {
        periode: `${faker.date.month()} ${faker.date.past().getFullYear()}`,
        nilai: faker.number.int({ min: 50, max: 100 }),
      },
    });
    periodes.push(periode);
  }

  // Insert Staff
  const staffList = [];
  for (let i = 0; i < 5; i++) {
    const staff = await prisma.staff.create({
      data: {
        name: faker.person.fullName(),
        jabatan: faker.person.jobTitle(),
        nip: faker.string.uuid(),
        tunjangan: faker.finance.amount(1000000, 5000000, 0, "Rp "),
      },
    });
    staffList.push(staff);
  }

  // Insert Tasks (Setiap Staff Punya 5 Task)
  for (const staff of staffList) {
    for (let i = 0; i < 5; i++) {
      await prisma.task.create({
        data: {
          deskripsi: faker.lorem.sentence(),
          nilai: faker.number.int({ min: 50, max: 100 }),
          staffId: staff.id,
          periodeId: faker.helpers.arrayElement(periodes).id,
        },
      });
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
