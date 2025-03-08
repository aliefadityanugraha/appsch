import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

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
