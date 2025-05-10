const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Seed Periode
  const periodes = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
          prisma.periode.create({
            data: {
              periode: `202${i + 1}`,
              nilai: (i + 1) * 10,
            },
          })
      )
  );

  // 2. Seed Staff
  const staffs = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
          prisma.staff.create({
            data: {
              name: `Staff ${i + 1}`,
              jabatan: `Jabatan ${i + 1}`,
              nip: `NIP00${i + 1}`,
              tunjangan: `${1000000 * (i + 1)}`,
            },
          })
      )
  );

  // 3. Seed Task (terkait dengan staff dan periode)
  const tasks = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
          prisma.task.create({
            data: {
              deskripsi: `Tugas ke-${i + 1}`,
              nilai: (i + 1) * 20,
              staffId: staffs[i % staffs.length].id,
              periodeId: periodes[i % periodes.length].id,
            },
          })
      )
  );

  // 4. Seed Records (terkait dengan staff dan menyimpan task list sebagai JSON)
  await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
          prisma.records.create({
            data: {
              value: (i + 1) * 2.5,
              taskList: tasks.map(task => ({ id: task.id, deskripsi: task.deskripsi })),
              staffId: staffs[i % staffs.length].id,
            },
          })
      )
  );

  console.log('✅ Seeding selesai!');
}

main()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
