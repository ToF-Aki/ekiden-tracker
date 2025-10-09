const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 デモ用のサンプルデータを作成中...');

  // デフォルト管理者ユーザーの作成
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '管理者',
    },
  });

  console.log('✅ 管理者ユーザー:', admin.username);

  // デモ用イベントを作成
  const demoEvent = await prisma.event.create({
    data: {
      name: '第1回社内駅伝大会（デモ）',
      date: new Date('2024-10-10'),
      status: '進行中',
      userId: admin.id,
    },
  });

  console.log('✅ デモイベント作成:', demoEvent.name);

  // チェックポイントを作成
  const checkpoints = await Promise.all([
    prisma.checkpoint.create({
      data: { eventId: demoEvent.id, distance: 1, name: '1km地点' },
    }),
    prisma.checkpoint.create({
      data: { eventId: demoEvent.id, distance: 2, name: '2km地点' },
    }),
    prisma.checkpoint.create({
      data: { eventId: demoEvent.id, distance: 3, name: '3km地点' },
    }),
    prisma.checkpoint.create({
      data: { eventId: demoEvent.id, distance: 4, name: '4km地点' },
    }),
  ]);

  console.log('✅ チェックポイント作成:', checkpoints.length + '個');

  // デモ用チームを作成
  const teams = [
    {
      teamNumber: 1,
      teamName: '営業部A',
      member1: '山田太郎',
      member2: '佐藤花子',
      member3: '鈴木一郎',
      member4: '田中美咲',
      member5: '高橋健太',
    },
    {
      teamNumber: 2,
      teamName: '開発部B',
      member1: '伊藤次郎',
      member2: '渡辺春子',
      member3: '中村二郎',
      member4: '小林夏美',
      member5: '加藤三郎',
    },
    {
      teamNumber: 3,
      teamName: 'マーケ部C',
      member1: '吉田四郎',
      member2: '山本秋子',
      member3: '林五郎',
      member4: '松本冬美',
      member5: '清水六郎',
    },
    {
      teamNumber: 4,
      teamName: '人事部D',
      member1: '森七郎',
      member2: '石川春美',
      member3: '木村八郎',
      member4: '川上夏子',
      member5: '野口九郎',
    },
    {
      teamNumber: 5,
      teamName: '総務部E',
      member1: '福島十郎',
      member2: '岡田冬子',
      member3: '中島十一郎',
      member4: '西田春美',
      member5: '東山十二郎',
    },
  ];

  const createdTeams = [];
  for (const teamData of teams) {
    const team = await prisma.team.create({
      data: {
        eventId: demoEvent.id,
        ...teamData,
      },
    });
    createdTeams.push(team);
  }

  console.log('✅ チーム作成:', createdTeams.length + 'チーム');

  // デモ用通過記録を作成（リアルな進行状況をシミュレート）
  const records = [
    // チーム1（営業部A）- リーダー、1km通過済み
    {
      teamId: createdTeams[0].id,
      checkpointId: checkpoints[0].id, // 1km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:15:00'),
    },
    {
      teamId: createdTeams[0].id,
      checkpointId: checkpoints[1].id, // 2km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:25:00'),
    },
    {
      teamId: createdTeams[0].id,
      checkpointId: checkpoints[2].id, // 3km
      runnerNumber: 2,
      timestamp: new Date('2024-10-10T09:35:00'),
    },
    {
      teamId: createdTeams[0].id,
      checkpointId: checkpoints[3].id, // 4km
      runnerNumber: 2,
      timestamp: new Date('2024-10-10T09:45:00'),
    },

    // チーム2（開発部B）- 2位、4km地点まで
    {
      teamId: createdTeams[1].id,
      checkpointId: checkpoints[0].id, // 1km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:16:00'),
    },
    {
      teamId: createdTeams[1].id,
      checkpointId: checkpoints[1].id, // 2km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:26:00'),
    },
    {
      teamId: createdTeams[1].id,
      checkpointId: checkpoints[2].id, // 3km
      runnerNumber: 2,
      timestamp: new Date('2024-10-10T09:37:00'),
    },
    {
      teamId: createdTeams[1].id,
      checkpointId: checkpoints[3].id, // 4km
      runnerNumber: 2,
      timestamp: new Date('2024-10-10T09:47:00'),
    },

    // チーム3（マーケ部C）- 3位、3km地点まで
    {
      teamId: createdTeams[2].id,
      checkpointId: checkpoints[0].id, // 1km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:17:00'),
    },
    {
      teamId: createdTeams[2].id,
      checkpointId: checkpoints[1].id, // 2km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:28:00'),
    },
    {
      teamId: createdTeams[2].id,
      checkpointId: checkpoints[2].id, // 3km
      runnerNumber: 2,
      timestamp: new Date('2024-10-10T09:40:00'),
    },

    // チーム4（人事部D）- 4位、2km地点まで
    {
      teamId: createdTeams[3].id,
      checkpointId: checkpoints[0].id, // 1km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:18:00'),
    },
    {
      teamId: createdTeams[3].id,
      checkpointId: checkpoints[1].id, // 2km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:30:00'),
    },

    // チーム5（総務部E）- 5位、1km地点のみ
    {
      teamId: createdTeams[4].id,
      checkpointId: checkpoints[0].id, // 1km
      runnerNumber: 1,
      timestamp: new Date('2024-10-10T09:20:00'),
    },
  ];

  for (const recordData of records) {
    await prisma.record.create({
      data: recordData,
    });
  }

  console.log('✅ 通過記録作成:', records.length + '件');

  console.log('\n🎉 デモデータの作成が完了しました!');
  console.log(`📊 イベントID: ${demoEvent.id}`);
  console.log('📱 速報画面URL: http://localhost:3000/live/' + demoEvent.id);
  console.log('📝 入力画面URL: http://localhost:3000/checkpoint/' + demoEvent.id);
  console.log('⚙️  管理画面URL: http://localhost:3000/admin/events/' + demoEvent.id);
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
