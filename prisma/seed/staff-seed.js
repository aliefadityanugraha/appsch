import {PrismaClient} from "@prisma/client";
import {faker} from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    const staffList = [];
    for (let i = 0; i < 20; i++) {
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
        for (let i = 0; i < 3; i++) {
            await prisma.task.create({
                data: {
                    deskripsi: faker.lorem.sentence(),
                    nilai: faker.number.int({min: 80, max: 100}),
                    staffId: staff.id,
                    periodeId: "aff07bab-f144-4fef-871a-7824dba6e17b",
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
