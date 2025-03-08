import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

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
